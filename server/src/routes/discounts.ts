/**
 * Discount codes — admin CRUD + public validation endpoint used by checkout.
 *
 *   GET  /api/discounts                — admin list
 *   POST /api/discounts                — admin create
 *   PUT  /api/discounts/:code          — admin update
 *   DELETE /api/discounts/:code        — admin delete
 *   POST /api/discounts/validate       — public { code, subtotal, currency } → { ok, amount, kind, reason? }
 *
 * `validateDiscount()` is exported so the orders route can re-use the exact
 * same logic at submit time.
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

interface DiscountRow {
  code: string; kind: string; amount: number; currency: string | null;
  min_subtotal: number; starts_at: string | null; ends_at: string | null;
  max_uses: number | null; uses: number; active: number; description: string | null;
  created_at: string;
}

function rowToDto(r: DiscountRow) {
  return {
    code: r.code, kind: r.kind, amount: r.amount,
    currency: r.currency || null,
    minSubtotal: r.min_subtotal,
    startsAt: r.starts_at || null, endsAt: r.ends_at || null,
    maxUses: r.max_uses, uses: r.uses, active: !!r.active,
    description: r.description || '', createdAt: r.created_at
  };
}

export interface DiscountValidation {
  ok: boolean;
  code: string;
  kind?: 'percent' | 'fixed' | 'free_shipping';
  amount: number;        // amount in the order's currency
  reason?: string;
}

export function validateDiscount(rawCode: string, subtotal: number, currency: 'USD' | 'CNY'): DiscountValidation {
  const code = rawCode.trim().toUpperCase();
  const r = db.prepare('SELECT * FROM discount_codes WHERE code = ?').get(code) as DiscountRow | undefined;
  if (!r) return { ok: false, code, amount: 0, reason: '优惠码不存在' };
  if (!r.active) return { ok: false, code, amount: 0, reason: '已停用' };
  const now = Date.now();
  if (r.starts_at && new Date(r.starts_at).getTime() > now) return { ok: false, code, amount: 0, reason: '尚未生效' };
  if (r.ends_at && new Date(r.ends_at).getTime() < now) return { ok: false, code, amount: 0, reason: '已过期' };
  if (r.max_uses !== null && r.uses >= r.max_uses) return { ok: false, code, amount: 0, reason: '使用次数已用完' };
  if (r.currency && r.currency !== currency) return { ok: false, code, amount: 0, reason: `仅支持 ${r.currency} 订单` };
  if (subtotal < r.min_subtotal) return { ok: false, code, amount: 0, reason: `订单需满足最低消费 ${r.min_subtotal}` };
  let amount = 0;
  if (r.kind === 'percent') amount = Math.round((subtotal * r.amount) / 100 * 100) / 100;
  else if (r.kind === 'fixed') amount = Math.min(r.amount, subtotal);
  // free_shipping is handled by the orders/shipping layer; amount stays 0 here
  return { ok: true, code, kind: r.kind as DiscountValidation['kind'], amount };
}

// ── Admin ──
router.get('/', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all() as DiscountRow[];
  res.json(rows.map(rowToDto));
});

router.post('/', requireAdmin, (req: AuthRequest, res) => {
  const d = req.body;
  const code = String(d.code || '').trim().toUpperCase();
  if (!code) { res.status(400).json({ error: '优惠码不能为空' }); return; }
  if (!['percent', 'fixed', 'free_shipping'].includes(d.kind)) {
    res.status(400).json({ error: '类型无效' }); return;
  }
  const exists = db.prepare('SELECT 1 FROM discount_codes WHERE code = ?').get(code);
  if (exists) { res.status(409).json({ error: '该优惠码已存在' }); return; }
  db.prepare(`INSERT INTO discount_codes
    (code, kind, amount, currency, min_subtotal, starts_at, ends_at, max_uses, active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      code, d.kind, Number(d.amount) || 0,
      d.currency || null, Number(d.minSubtotal) || 0,
      d.startsAt || null, d.endsAt || null,
      d.maxUses ? Number(d.maxUses) : null,
      d.active === false ? 0 : 1,
      d.description || null
    );
  logAction(req.admin!.username, 'discount.create', code);
  res.status(201).json({ code });
});

router.put('/:code', requireAdmin, (req: AuthRequest, res) => {
  const d = req.body;
  const code = req.params.code.toUpperCase();
  db.prepare(`UPDATE discount_codes SET
    kind = ?, amount = ?, currency = ?, min_subtotal = ?,
    starts_at = ?, ends_at = ?, max_uses = ?, active = ?, description = ?
    WHERE code = ?`).run(
      d.kind, Number(d.amount) || 0, d.currency || null,
      Number(d.minSubtotal) || 0,
      d.startsAt || null, d.endsAt || null,
      d.maxUses ? Number(d.maxUses) : null,
      d.active === false ? 0 : 1, d.description || null,
      code
    );
  logAction(req.admin!.username, 'discount.update', code);
  res.json({ ok: true });
});

router.delete('/:code', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM discount_codes WHERE code = ?').run(req.params.code.toUpperCase());
  logAction(req.admin!.username, 'discount.delete', req.params.code.toUpperCase());
  res.json({ ok: true });
});

// ── Public ──
router.post('/validate', (req, res) => {
  const { code, subtotal, currency } = req.body ?? {};
  if (!code) { res.status(400).json({ ok: false, reason: '请输入优惠码' }); return; }
  const v = validateDiscount(String(code), Number(subtotal) || 0, currency === 'USD' ? 'USD' : 'CNY');
  res.json(v);
});

export default router;
