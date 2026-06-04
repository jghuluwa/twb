import { Router } from 'express';
import { db } from '../db.js';
import {
  clearCustomerCookie, hashPassword, issueCustomerCookie, requireAdmin,
  requireCustomer, verifyPassword, type AuthRequest
} from '../lib/auth.js';
import { rowToOrder, type OrderItemRow, type OrderRow } from '../lib/serializers.js';
import { sendWelcomeEmail } from '../lib/email.js';

const router = Router();

function newCustomerId(): string {
  return 'CUS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function newAddressId(): string {
  return 'AD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function validEmail(s: string): boolean {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

interface CustomerRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  country: string | null;
  status: 'active' | 'disabled';
  created_at: string;
  last_login_at: string | null;
}

function rowToCustomer(r: CustomerRow) {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    phone: r.phone || undefined,
    country: r.country || undefined,
    status: r.status,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at || undefined
  };
}

// ── Self-service ──
router.post('/register', async (req, res) => {
  const { name, email, password, phone, country } = req.body ?? {};
  if (!name || !validEmail(email)) { res.status(400).json({ error: '姓名或邮箱无效' }); return; }
  if (!password || String(password).length < 6) { res.status(400).json({ error: '密码至少 6 位' }); return; }
  const key = String(email).trim().toLowerCase();
  const exists = db.prepare('SELECT 1 FROM customers WHERE email = ?').get(key);
  if (exists) { res.status(409).json({ error: '该邮箱已被注册' }); return; }
  const id = newCustomerId();
  const hash = await hashPassword(password);
  db.prepare(`
    INSERT INTO customers (id, email, password_hash, name, phone, country, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, key, hash, String(name).trim(), phone || null, country || null);
  issueCustomerCookie(res, { customerId: id, email: key });
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as CustomerRow;
  void sendWelcomeEmail({ name: row.name, email: row.email });
  res.status(201).json(rowToCustomer(row));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!validEmail(email)) { res.status(400).json({ error: '邮箱无效' }); return; }
  const key = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT * FROM customers WHERE email = ?').get(key) as CustomerRow | undefined;
  if (!row) { res.status(401).json({ error: '账号不存在' }); return; }
  if (row.status === 'disabled') { res.status(403).json({ error: '该账号已被停用，请联系客服' }); return; }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) { res.status(401).json({ error: '密码错误' }); return; }
  db.prepare("UPDATE customers SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  issueCustomerCookie(res, { customerId: row.id, email: row.email });
  res.json(rowToCustomer(row));
});

router.post('/logout', (_req, res) => {
  clearCustomerCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireCustomer, (req: AuthRequest, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.customer!.customerId) as CustomerRow | undefined;
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  if (row.status === 'disabled') { clearCustomerCookie(res); res.status(403).json({ error: '账号已被停用' }); return; }
  res.json(rowToCustomer(row));
});

router.put('/me', requireCustomer, (req: AuthRequest, res) => {
  const { name, phone, country } = req.body ?? {};
  db.prepare(`
    UPDATE customers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      country = COALESCE(?, country)
    WHERE id = ?
  `).run(
    name ? String(name).trim() : null,
    phone !== undefined ? (String(phone).trim() || null) : null,
    country !== undefined ? (String(country).trim() || null) : null,
    req.customer!.customerId
  );
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.customer!.customerId) as CustomerRow;
  res.json(rowToCustomer(row));
});

router.post('/me/password', requireCustomer, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body ?? {};
  if (!oldPassword || !newPassword) { res.status(400).json({ error: '参数无效' }); return; }
  if (String(newPassword).length < 6) { res.status(400).json({ error: '新密码至少 6 位' }); return; }
  const row = db.prepare('SELECT password_hash FROM customers WHERE id = ?')
    .get(req.customer!.customerId) as { password_hash: string } | undefined;
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  const ok = await verifyPassword(oldPassword, row.password_hash);
  if (!ok) { res.status(400).json({ error: '原密码不正确' }); return; }
  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE customers SET password_hash = ? WHERE id = ?').run(hash, req.customer!.customerId);
  res.json({ ok: true });
});

// ── Addresses ──
router.get('/me/addresses', requireCustomer, (req: AuthRequest, res) => {
  const rows = db.prepare('SELECT * FROM customer_addresses WHERE customer_id = ?').all(req.customer!.customerId);
  res.json(rows.map((r: any) => ({
    id: r.id, label: r.label, recipient: r.recipient, phone: r.phone,
    country: r.country, address: r.address, isDefault: !!r.is_default
  })));
});

router.post('/me/addresses', requireCustomer, (req: AuthRequest, res) => {
  const { label, recipient, phone, country, address, isDefault } = req.body ?? {};
  if (!label || !recipient || !phone || !country || !address) {
    res.status(400).json({ error: '地址信息不完整' }); return;
  }
  const cid = req.customer!.customerId;
  const id = newAddressId();
  const existingCount = (db.prepare('SELECT COUNT(*) AS n FROM customer_addresses WHERE customer_id = ?')
    .get(cid) as { n: number }).n;
  const makeDefault = isDefault || existingCount === 0;
  if (makeDefault) {
    db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?').run(cid);
  }
  db.prepare(`
    INSERT INTO customer_addresses (id, customer_id, label, recipient, phone, country, address, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, cid, label, recipient, phone, country, address, makeDefault ? 1 : 0);
  res.status(201).json({ id });
});

router.put('/me/addresses/:id', requireCustomer, (req: AuthRequest, res) => {
  const cid = req.customer!.customerId;
  const row = db.prepare('SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?')
    .get(req.params.id, cid);
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  const { label, recipient, phone, country, address, isDefault } = req.body ?? {};
  if (isDefault) {
    db.prepare('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?').run(cid);
  }
  db.prepare(`
    UPDATE customer_addresses SET
      label = COALESCE(?, label),
      recipient = COALESCE(?, recipient),
      phone = COALESCE(?, phone),
      country = COALESCE(?, country),
      address = COALESCE(?, address),
      is_default = COALESCE(?, is_default)
    WHERE id = ?
  `).run(label, recipient, phone, country, address, isDefault === undefined ? null : (isDefault ? 1 : 0), req.params.id);
  res.json({ ok: true });
});

router.delete('/me/addresses/:id', requireCustomer, (req: AuthRequest, res) => {
  const cid = req.customer!.customerId;
  db.prepare('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?').run(req.params.id, cid);
  res.json({ ok: true });
});

router.get('/me/orders', requireCustomer, (req: AuthRequest, res) => {
  const cid = req.customer!.customerId;
  const rows = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(cid) as OrderRow[];
  const items = db.prepare('SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ?)')
    .all(cid) as OrderItemRow[];
  const itemsByOrder = new Map<string, OrderItemRow[]>();
  items.forEach((it) => {
    const arr = itemsByOrder.get(it.order_id) || [];
    arr.push(it);
    itemsByOrder.set(it.order_id, arr);
  });
  res.json(rows.map((r) => rowToOrder(r, itemsByOrder.get(r.id) || [])));
});

// ── Admin operations on customer accounts ──
router.get('/admin/list', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as CustomerRow[];
  res.json(rows.map(rowToCustomer));
});

router.patch('/admin/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body ?? {};
  if (!['active', 'disabled'].includes(status)) { res.status(400).json({ error: '参数无效' }); return; }
  db.prepare('UPDATE customers SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.post('/admin/:id/reset-password', requireAdmin, async (req, res) => {
  const { newPassword } = req.body ?? {};
  if (!newPassword || String(newPassword).length < 6) { res.status(400).json({ error: '密码至少 6 位' }); return; }
  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE customers SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
