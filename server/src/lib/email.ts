/**
 * Email service.
 *
 * Transport: Nodemailer. Configuration lives in the `site_settings` table so
 * the admin can change SMTP credentials at runtime without redeploying.
 * Falls back to env vars (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM)
 * on first run, before the admin has saved anything.
 *
 * If neither source has SMTP configured, sendEmail() logs the message to the
 * email_logs table with status='failed' and returns false — the rest of the
 * app keeps working, just without outbound email.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { db } from '../db.js';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function getSettings(): Partial<SmtpConfig> {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'smtp'`).get() as { value: string } | undefined;
  if (!row) return {};
  try { return JSON.parse(row.value) as Partial<SmtpConfig>; } catch { return {}; }
}

function getConfig(): SmtpConfig | null {
  const s = getSettings();
  const host  = s.host  || process.env.SMTP_HOST || '';
  const port  = s.port  || Number(process.env.SMTP_PORT || 587);
  const user  = s.user  || process.env.SMTP_USER || '';
  const pass  = s.pass  || process.env.SMTP_PASS || '';
  const from  = s.from  || process.env.SMTP_FROM || user;
  const secure = s.secure !== undefined ? s.secure : port === 465;
  if (!host || !user || !pass) return null;
  return { host, port, secure, user, pass, from };
}

let cachedTransport: Transporter | null = null;
let cachedKey = '';

function getTransport(): Transporter | null {
  const cfg = getConfig();
  if (!cfg) { cachedTransport = null; cachedKey = ''; return null; }
  const key = JSON.stringify(cfg);
  if (cachedTransport && cachedKey === key) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });
  cachedKey = key;
  return cachedTransport;
}

export function isEmailConfigured(): boolean {
  return !!getConfig();
}

export interface SendOpts {
  to: string;
  subject: string;
  html: string;
  kind: string;                       // order_confirmation | payment_receipt | welcome | shipped | campaign | custom
  campaignId?: string;
  orderId?: string;
}

export async function sendEmail(opts: SendOpts): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) {
    db.prepare(`INSERT INTO email_logs (to_addr, subject, kind, campaign_id, order_id, status, error)
      VALUES (?, ?, ?, ?, ?, 'failed', 'SMTP not configured')`)
      .run(opts.to, opts.subject, opts.kind, opts.campaignId || null, opts.orderId || null);
    return false;
  }
  const t = getTransport();
  if (!t) return false;
  try {
    await t.sendMail({
      from: cfg.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html
    });
    db.prepare(`INSERT INTO email_logs (to_addr, subject, kind, campaign_id, order_id, status)
      VALUES (?, ?, ?, ?, ?, 'sent')`)
      .run(opts.to, opts.subject, opts.kind, opts.campaignId || null, opts.orderId || null);
    return true;
  } catch (err) {
    db.prepare(`INSERT INTO email_logs (to_addr, subject, kind, campaign_id, order_id, status, error)
      VALUES (?, ?, ?, ?, ?, 'failed', ?)`)
      .run(opts.to, opts.subject, opts.kind, opts.campaignId || null, opts.orderId || null,
        err instanceof Error ? err.message : String(err));
    return false;
  }
}

// ──────────── Template rendering ────────────
export function renderTemplate(html: string, vars: Record<string, string | number>): string {
  return html.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function loadTemplate(id: string): { subject: string; body_html: string } | null {
  const row = db.prepare('SELECT subject, body_html FROM email_templates WHERE id = ?').get(id) as
    { subject: string; body_html: string } | undefined;
  return row || null;
}

// ──────────── Helpers: built-in transactional emails ────────────
export async function sendOrderConfirmation(order: {
  id: string; total: number; subtotal: number; discount_amount: number; shipping_fee: number;
  currency: string; customer_name: string; customer_email: string;
}): Promise<void> {
  const tpl = loadTemplate('order_confirmation');
  if (!tpl) return;
  const sym = order.currency === 'CNY' ? '¥' : '$';
  const html = renderTemplate(tpl.body_html, {
    customerName: order.customer_name,
    orderId: order.id,
    currencySymbol: sym,
    subtotal: order.subtotal.toLocaleString(),
    discount: order.discount_amount.toLocaleString(),
    shipping: order.shipping_fee.toLocaleString(),
    total: (order.subtotal - order.discount_amount + order.shipping_fee).toLocaleString()
  });
  const subject = renderTemplate(tpl.subject, { orderId: order.id });
  await sendEmail({ to: order.customer_email, subject, html, kind: 'order_confirmation', orderId: order.id });
}

export async function sendPaymentReceipt(order: {
  id: string; currency: string; customer_name: string; customer_email: string;
  subtotal: number; discount_amount: number; shipping_fee: number;
}): Promise<void> {
  const tpl = loadTemplate('payment_receipt');
  if (!tpl) return;
  const sym = order.currency === 'CNY' ? '¥' : '$';
  const html = renderTemplate(tpl.body_html, {
    customerName: order.customer_name,
    orderId: order.id,
    currencySymbol: sym,
    total: (order.subtotal - order.discount_amount + order.shipping_fee).toLocaleString()
  });
  const subject = renderTemplate(tpl.subject, { orderId: order.id });
  await sendEmail({ to: order.customer_email, subject, html, kind: 'payment_receipt', orderId: order.id });
}

export async function sendShipmentNotification(order: {
  id: string; customer_name: string; customer_email: string; tracking_number: string;
}): Promise<void> {
  const tpl = loadTemplate('shipment_notification');
  if (!tpl) return;
  const html = renderTemplate(tpl.body_html, {
    customerName: order.customer_name,
    orderId: order.id,
    trackingNumber: order.tracking_number || '(待补)'
  });
  const subject = renderTemplate(tpl.subject, { orderId: order.id });
  await sendEmail({ to: order.customer_email, subject, html, kind: 'shipment_notification', orderId: order.id });
}

export async function sendWelcomeEmail(customer: { name: string; email: string }): Promise<void> {
  const tpl = loadTemplate('welcome');
  if (!tpl) return;
  const html = renderTemplate(tpl.body_html, { customerName: customer.name });
  const subject = renderTemplate(tpl.subject, { customerName: customer.name });
  await sendEmail({ to: customer.email, subject, html, kind: 'welcome' });
}

// ──────────── Default templates seeded on first start ────────────
export const DEFAULT_TEMPLATES: Array<{ id: string; name: string; subject: string; body_html: string; kind: 'system' | 'marketing' }> = [
  {
    id: 'order_confirmation',
    name: '订单确认（自动）',
    kind: 'system',
    subject: '我们收到您的订单 {{orderId}} — Therabo',
    body_html: `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <h2 style="color:#e11d48">订单已收到</h2>
  <p>您好 {{customerName}}，</p>
  <p>感谢您选购 Therabo 通微宝产品。订单号 <strong>{{orderId}}</strong> 已成功提交，等待支付确认。</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td>小计</td><td align="right">{{currencySymbol}}{{subtotal}}</td></tr>
    <tr><td>优惠</td><td align="right">- {{currencySymbol}}{{discount}}</td></tr>
    <tr><td>运费</td><td align="right">{{currencySymbol}}{{shipping}}</td></tr>
    <tr style="font-weight:bold;border-top:1px solid #ddd"><td>合计</td><td align="right">{{currencySymbol}}{{total}}</td></tr>
  </table>
  <p>如有任何问题，可直接回复本邮件联系客服。</p>
  <p style="color:#94a3b8;font-size:12px">— Therabo / 北京中科医用材料有限公司</p>
</div>`
  },
  {
    id: 'payment_receipt',
    name: '支付收据（自动）',
    kind: 'system',
    subject: '收款确认 — 订单 {{orderId}}',
    body_html: `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <h2 style="color:#059669">支付成功</h2>
  <p>您好 {{customerName}}，</p>
  <p>订单 <strong>{{orderId}}</strong> 已收到 {{currencySymbol}}{{total}} 付款。</p>
  <p>我们将尽快备货发货，发货后会另发邮件告知物流单号。</p>
</div>`
  },
  {
    id: 'shipment_notification',
    name: '发货通知（自动）',
    kind: 'system',
    subject: '您的订单 {{orderId}} 已发货',
    body_html: `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <h2 style="color:#7c3aed">订单已发货</h2>
  <p>您好 {{customerName}}，</p>
  <p>订单 <strong>{{orderId}}</strong> 已发出，物流单号：<strong>{{trackingNumber}}</strong></p>
</div>`
  },
  {
    id: 'welcome',
    name: '欢迎注册（自动）',
    kind: 'system',
    subject: '欢迎加入 Therabo / 通微宝，{{customerName}}',
    body_html: `
<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
  <h2>欢迎，{{customerName}}！</h2>
  <p>感谢您注册 Therabo 通微宝账户。</p>
  <p>登录账户后您可以追踪订单、保存收货地址、享受老用户专属优惠。</p>
</div>`
  }
];

export function seedDefaultTemplates(): void {
  const exists = db.prepare('SELECT COUNT(*) AS n FROM email_templates').get() as { n: number };
  if (exists.n > 0) return;
  const stmt = db.prepare(`INSERT INTO email_templates (id, name, subject, body_html, kind)
    VALUES (?, ?, ?, ?, ?)`);
  for (const t of DEFAULT_TEMPLATES) stmt.run(t.id, t.name, t.subject, t.body_html, t.kind);
}
