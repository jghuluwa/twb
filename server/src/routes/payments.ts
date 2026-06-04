/**
 * Payment integrations:
 *   POST  /api/payments/stripe/checkout       — start Stripe Checkout for an order
 *   POST  /api/payments/stripe/webhook        — Stripe webhook (raw body, no JSON parser)
 *   POST  /api/payments/alipay/checkout       — generate Alipay PC pay URL or QR
 *   POST  /api/payments/alipay/notify         — Alipay async notify webhook
 *   POST  /api/payments/wechat/checkout       — generate WeChat Pay native QR
 *   POST  /api/payments/wechat/notify         — WeChat Pay v3 notify webhook
 *
 * All three providers gracefully degrade: if env credentials are missing,
 * the route returns HTTP 503 with a clear "not configured" message so the
 * site stays functional while only "manual payment" is offered.
 *
 * NOTE: Alipay & WeChat WeChat Pay require real merchant accounts. The wiring
 * here is correct, but the merchant must finish provider on-boarding and place
 * the cert/key files where the env vars point.
 */
import express, { Router, type RequestHandler } from 'express';
import Stripe from 'stripe';
import { db, withTransaction } from '../db.js';
import { sendPaymentReceipt } from '../lib/email.js';

function fireReceiptEmail(orderId: string): void {
  const o = db.prepare(`SELECT id, currency, customer_name, customer_email, subtotal, discount_amount, shipping_fee
    FROM orders WHERE id = ?`).get(orderId) as
    { id: string; currency: string; customer_name: string; customer_email: string;
      subtotal: number; discount_amount: number; shipping_fee: number } | undefined;
  if (o) void sendPaymentReceipt(o);
}

const router = Router();

// ──────────────────────────── STRIPE ────────────────────────────
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:8080';
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;

router.post('/stripe/checkout', async (req, res) => {
  if (!stripe) { res.status(503).json({ error: 'Stripe 未配置 — 请在 .env 设置 STRIPE_SECRET_KEY' }); return; }
  const { orderId } = req.body ?? {};
  if (!orderId) { res.status(400).json({ error: '缺少 orderId' }); return; }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) { res.status(404).json({ error: '订单不存在' }); return; }
  if (order.status === 'paid') { res.status(400).json({ error: '订单已支付' }); return; }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: Math.round(it.unit_price * 100),
          product_data: {
            name: `${it.product_name} (${it.selected_size} / ${it.selected_color_name})`
          }
        }
      })),
      customer_email: order.customer_email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      success_url: `${APP_URL}/?paid=${order.id}`,
      cancel_url:  `${APP_URL}/?cancelled=${order.id}`
    });
    db.prepare("UPDATE orders SET payment_method = 'stripe', payment_ref = ? WHERE id = ?")
      .run(session.id, order.id);
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe 创建会话失败' });
  }
});

// Stripe needs the raw body to verify the signature, so we mount the raw-body
// parser here per-route (the global JSON parser is excluded for this path in index.ts).
export const stripeWebhookHandler: RequestHandler = async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK) { res.status(503).send('Stripe webhook not configured'); return; }
  const sig = req.headers['stripe-signature'];
  if (!sig || typeof sig !== 'string') { res.status(400).send('missing signature'); return; }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, STRIPE_WEBHOOK);
  } catch (err) {
    res.status(400).send(`signature failed: ${err instanceof Error ? err.message : ''}`); return;
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (orderId) {
      withTransaction(() => {
        db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now'), payment_ref = ? WHERE id = ?")
          .run(session.id, orderId);
      });
      fireReceiptEmail(orderId);
    }
  }
  res.json({ received: true });
};

// ──────────────────────────── ALIPAY ────────────────────────────
let alipaySdk: any = null;
async function getAlipay() {
  if (alipaySdk) return alipaySdk;
  if (!process.env.ALIPAY_APP_ID || !process.env.ALIPAY_PRIVATE_KEY || !process.env.ALIPAY_PUBLIC_KEY) return null;
  const mod = await import('alipay-sdk');
  const AlipaySdk = (mod as any).default || (mod as any).AlipaySdk || mod;
  alipaySdk = new AlipaySdk({
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY.replace(/\\n/g, '\n'),
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY.replace(/\\n/g, '\n'),
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'
  });
  return alipaySdk;
}

router.post('/alipay/checkout', async (req, res) => {
  const alipay = await getAlipay();
  if (!alipay) { res.status(503).json({ error: '支付宝未配置 — 请在 .env 设置 ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY' }); return; }
  const { orderId } = req.body ?? {};
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) { res.status(404).json({ error: '订单不存在' }); return; }
  if (order.currency !== 'CNY') { res.status(400).json({ error: '支付宝仅支持 CNY 订单' }); return; }
  try {
    const url = await alipay.pageExec('alipay.trade.page.pay', {
      bizContent: {
        out_trade_no: order.id,
        total_amount: order.subtotal.toFixed(2),
        subject: `Therabo 订单 ${order.id}`,
        product_code: 'FAST_INSTANT_TRADE_PAY'
      },
      returnUrl: `${APP_URL}/?paid=${order.id}`,
      notifyUrl: `${APP_URL}/api/payments/alipay/notify`
    });
    db.prepare("UPDATE orders SET payment_method = 'alipay' WHERE id = ?").run(order.id);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : '支付宝下单失败' });
  }
});

router.post('/alipay/notify', express.urlencoded({ extended: false }), async (req, res) => {
  const alipay = await getAlipay();
  if (!alipay) { res.status(503).send('not configured'); return; }
  const params = req.body as Record<string, string>;
  try {
    const valid = alipay.checkNotifySign ? alipay.checkNotifySign(params) : false;
    if (!valid) { res.status(400).send('invalid sign'); return; }
    if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now'), payment_ref = ? WHERE id = ?")
        .run(params.trade_no, params.out_trade_no);
      fireReceiptEmail(params.out_trade_no);
    }
    res.send('success');
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : 'error');
  }
});

// ──────────────────────────── WECHAT PAY ────────────────────────────
let wechatSdk: any = null;
async function getWechat() {
  if (wechatSdk) return wechatSdk;
  if (!process.env.WECHAT_APPID || !process.env.WECHAT_MCH_ID ||
      !process.env.WECHAT_PRIVATE_KEY || !process.env.WECHAT_SERIAL_NO ||
      !process.env.WECHAT_API_V3_KEY) return null;
  const WxPay = (await import('wechatpay-node-v3')).default;
  wechatSdk = new WxPay({
    appid: process.env.WECHAT_APPID,
    mchid: process.env.WECHAT_MCH_ID,
    publicKey: Buffer.from(process.env.WECHAT_PUBLIC_KEY?.replace(/\\n/g, '\n') || ''),
    privateKey: Buffer.from(process.env.WECHAT_PRIVATE_KEY.replace(/\\n/g, '\n')),
    serial_no: process.env.WECHAT_SERIAL_NO,
    key: process.env.WECHAT_API_V3_KEY
  });
  return wechatSdk;
}

router.post('/wechat/checkout', async (req, res) => {
  const wx = await getWechat();
  if (!wx) { res.status(503).json({ error: '微信支付未配置 — 请在 .env 设置 WECHAT_* 凭据' }); return; }
  const { orderId } = req.body ?? {};
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) { res.status(404).json({ error: '订单不存在' }); return; }
  if (order.currency !== 'CNY') { res.status(400).json({ error: '微信支付仅支持 CNY 订单' }); return; }
  try {
    const result = await wx.transactions_native({
      description: `Therabo 订单 ${order.id}`,
      out_trade_no: order.id,
      notify_url: `${APP_URL}/api/payments/wechat/notify`,
      amount: { total: Math.round(order.subtotal * 100), currency: 'CNY' }
    });
    db.prepare("UPDATE orders SET payment_method = 'wechat' WHERE id = ?").run(order.id);
    res.json({ codeUrl: result.code_url || result.data?.code_url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : '微信下单失败' });
  }
});

router.post('/wechat/notify', express.json(), async (req, res) => {
  const wx = await getWechat();
  if (!wx) { res.status(503).json({ code: 'FAIL', message: 'not configured' }); return; }
  try {
    const { resource } = req.body as any;
    const decrypted = wx.decipher_gcm(
      resource.ciphertext, resource.associated_data, resource.nonce, process.env.WECHAT_API_V3_KEY!
    );
    const data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
    if (data.trade_state === 'SUCCESS') {
      db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now'), payment_ref = ? WHERE id = ?")
        .run(data.transaction_id, data.out_trade_no);
      fireReceiptEmail(data.out_trade_no);
    }
    res.json({ code: 'SUCCESS' });
  } catch (err) {
    res.status(500).json({ code: 'FAIL', message: err instanceof Error ? err.message : 'error' });
  }
});

// Public: tell the frontend which payment methods are currently configured
router.get('/methods', async (_req, res) => {
  res.json({
    stripe: !!stripe,
    alipay: !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY),
    wechat: !!(process.env.WECHAT_APPID && process.env.WECHAT_MCH_ID)
  });
});

export default router;
