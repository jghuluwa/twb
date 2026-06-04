import { Router } from 'express';
import { db, withTransaction } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { rowToOrder, type OrderItemRow, type OrderRow } from '../lib/serializers.js';
import { sendOrderConfirmation, sendShipmentNotification } from '../lib/email.js';
import { logAction } from '../lib/audit.js';
import { validateDiscount } from './discounts.js';
import { computeShipping } from './shipping.js';

const router = Router();

interface IncomingItem {
  productId: string;
  productName: string;
  selectedSize: string;
  selectedColorName: string;
  selectedColorHex: string;
  quantity: number;
  unitPrice: number;
}

interface IncomingOrder {
  currency: 'USD' | 'CNY';
  items: IncomingItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    country: string;
    address?: string;
  };
  note?: string;
  discountCode?: string;
  shippingMethodId?: string;
}

function nextOrderId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const prefix = `THB-${ymd}`;
  const count = (db.prepare(
    'SELECT COUNT(*) AS n FROM orders WHERE id LIKE ?'
  ).get(`${prefix}%`) as { n: number }).n;
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

function validate(input: IncomingOrder): string | null {
  if (!['USD', 'CNY'].includes(input.currency)) return '币种无效';
  if (!Array.isArray(input.items) || input.items.length === 0) return '购物车为空';
  if (!input.customer?.name || !input.customer.email || !input.customer.country) return '收件人信息不完整';
  return null;
}

// Anyone (logged-in or guest) can submit
router.post('/', async (req: AuthRequest, res) => {
  const input = req.body as IncomingOrder;
  const err = validate(input);
  if (err) { res.status(400).json({ error: err }); return; }

  const subtotal = input.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);

  // Discount
  let discountAmount = 0;
  let discountCodeApplied: string | undefined;
  if (input.discountCode) {
    const v = validateDiscount(input.discountCode, subtotal, input.currency);
    if (v.ok) {
      discountAmount = v.amount;
      discountCodeApplied = v.code;
    } else {
      res.status(400).json({ error: `优惠码无效：${v.reason}` }); return;
    }
  }

  // Shipping
  const ship = computeShipping(input.shippingMethodId, input.customer.country, input.currency, subtotal - discountAmount);

  // Check stock (if tracked)
  for (const it of input.items) {
    const p = db.prepare('SELECT stock FROM products WHERE id = ?').get(it.productId) as { stock: number | null } | undefined;
    if (p && p.stock !== null && p.stock < it.quantity) {
      res.status(400).json({ error: `${it.productName} 库存不足（剩 ${p.stock}）` }); return;
    }
  }

  const id = nextOrderId();
  withTransaction(() => {
    db.prepare(`
      INSERT INTO orders
        (id, status, currency, subtotal, customer_id,
         customer_name, customer_email, customer_phone, customer_country, customer_address,
         note, payment_method, discount_code, discount_amount, shipping_method_id, shipping_fee)
      VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
    `).run(
      id, input.currency, subtotal,
      req.customer?.customerId || null,
      input.customer.name, input.customer.email.toLowerCase(),
      input.customer.phone || null, input.customer.country, input.customer.address || null,
      input.note || null,
      discountCodeApplied || null, discountAmount,
      ship.methodId, ship.fee
    );
    const insertItem = db.prepare(`
      INSERT INTO order_items
        (order_id, product_id, product_name, selected_size, selected_color_name, selected_color_hex, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const decStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL');
    input.items.forEach((it) => {
      insertItem.run(
        id, it.productId, it.productName,
        it.selectedSize, it.selectedColorName, it.selectedColorHex,
        it.quantity, it.unitPrice
      );
      decStock.run(it.quantity, it.productId);
    });
    if (discountCodeApplied) {
      db.prepare('UPDATE discount_codes SET uses = uses + 1 WHERE code = ?').run(discountCodeApplied);
    }
  });

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as OrderItemRow[];

  // Fire-and-forget: send order confirmation email
  void sendOrderConfirmation({
    id: row.id, total: row.subtotal - row.discount_amount + row.shipping_fee,
    subtotal: row.subtotal, discount_amount: row.discount_amount, shipping_fee: row.shipping_fee,
    currency: row.currency, customer_name: row.customer_name, customer_email: row.customer_email
  });

  res.status(201).json(rowToOrder(row, items));
});

router.get('/admin', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as OrderRow[];
  const allItems = db.prepare('SELECT * FROM order_items').all() as OrderItemRow[];
  const byOrder = new Map<string, OrderItemRow[]>();
  allItems.forEach((it) => {
    const arr = byOrder.get(it.order_id) || [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  });
  res.json(rows.map((r) => rowToOrder(r, byOrder.get(r.id) || [])));
});

router.patch('/admin/:id/status', requireAdmin, async (req: AuthRequest, res) => {
  const { status } = req.body ?? {};
  if (!['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: '状态无效' }); return;
  }
  const paidAt = status === 'paid' ? "datetime('now')" : 'paid_at';
  const shippedAt = status === 'shipped' ? "datetime('now')" : 'shipped_at';
  db.prepare(`UPDATE orders SET status = ?, paid_at = ${paidAt}, shipped_at = ${shippedAt} WHERE id = ?`).run(status, req.params.id);
  logAction(req.admin!.username, 'order.status', req.params.id, { status });
  // Fire shipment email if newly shipped
  if (status === 'shipped') {
    const o = db.prepare('SELECT id, customer_name, customer_email, tracking_number FROM orders WHERE id = ?')
      .get(req.params.id) as { id: string; customer_name: string; customer_email: string; tracking_number: string } | undefined;
    if (o) void sendShipmentNotification(o);
  }
  res.json({ ok: true });
});

router.patch('/admin/:id/tracking', requireAdmin, (req: AuthRequest, res) => {
  const { trackingNumber } = req.body ?? {};
  db.prepare('UPDATE orders SET tracking_number = ? WHERE id = ?').run(trackingNumber || null, req.params.id);
  logAction(req.admin!.username, 'order.tracking', req.params.id, { trackingNumber });
  res.json({ ok: true });
});

router.delete('/admin/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'order.delete', req.params.id);
  res.json({ ok: true });
});

export default router;
