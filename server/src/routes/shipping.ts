/**
 * Shipping methods — per-country flat rate with optional free-shipping threshold.
 *
 *   GET    /api/shipping/available?country=...&currency=...&subtotal=...
 *   GET    /api/shipping             — admin list
 *   POST   /api/shipping             — admin create
 *   PUT    /api/shipping/:id         — admin update
 *   DELETE /api/shipping/:id         — admin delete
 *
 * computeShipping() is also exported and used by /api/orders at submit time.
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

interface ShippingRow {
  id: string; name: string; countries: string; currency: string;
  flat_fee: number; free_threshold: number | null; est_days: string | null;
  enabled: number; sort_order: number;
}

function safeI18n(s: string) { try { return JSON.parse(s); } catch { return { en: s, zh: s, 'zh-tw': s }; } }
function safeArr(s: string): string[] { try { return JSON.parse(s); } catch { return []; } }

function rowToDto(r: ShippingRow) {
  return {
    id: r.id, name: safeI18n(r.name),
    countries: safeArr(r.countries), currency: r.currency,
    flatFee: r.flat_fee, freeThreshold: r.free_threshold,
    estDays: r.est_days || null, enabled: !!r.enabled, sortOrder: r.sort_order
  };
}

function newId(): string { return 'SHIP-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }

function availableMethods(country: string, currency: 'USD' | 'CNY'): ShippingRow[] {
  const all = db.prepare('SELECT * FROM shipping_methods WHERE enabled = 1 AND currency = ? ORDER BY sort_order').all(currency) as ShippingRow[];
  const matches = (r: ShippingRow) => {
    const cs = safeArr(r.countries);
    return cs.includes('*') || cs.includes(country);
  };
  return all.filter(matches);
}

export function computeShipping(
  methodId: string | undefined,
  country: string,
  currency: 'USD' | 'CNY',
  subtotalAfterDiscount: number
): { methodId: string | null; fee: number } {
  const available = availableMethods(country, currency);
  if (available.length === 0) return { methodId: null, fee: 0 };
  const chosen = methodId
    ? (available.find((m) => m.id === methodId) || available[0])
    : available[0];
  if (chosen.free_threshold !== null && subtotalAfterDiscount >= chosen.free_threshold) {
    return { methodId: chosen.id, fee: 0 };
  }
  return { methodId: chosen.id, fee: chosen.flat_fee };
}

// Public lookup
router.get('/available', (req, res) => {
  const country = String(req.query.country || '');
  const currency = req.query.currency === 'USD' ? 'USD' : 'CNY';
  const subtotal = Number(req.query.subtotal || 0);
  const rows = availableMethods(country, currency);
  res.json(rows.map((r) => ({
    ...rowToDto(r),
    feeForOrder: (r.free_threshold !== null && subtotal >= r.free_threshold) ? 0 : r.flat_fee
  })));
});

// Admin
router.get('/', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM shipping_methods ORDER BY sort_order').all() as ShippingRow[];
  res.json(rows.map(rowToDto));
});

router.post('/', requireAdmin, (req: AuthRequest, res) => {
  const s = req.body;
  if (!['USD', 'CNY'].includes(s.currency)) { res.status(400).json({ error: '币种无效' }); return; }
  const id = newId();
  db.prepare(`INSERT INTO shipping_methods
    (id, name, countries, currency, flat_fee, free_threshold, est_days, enabled, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, JSON.stringify(s.name || { en: '', zh: '', 'zh-tw': '' }),
      JSON.stringify(Array.isArray(s.countries) && s.countries.length ? s.countries : ['*']),
      s.currency, Number(s.flatFee) || 0,
      s.freeThreshold !== undefined && s.freeThreshold !== null ? Number(s.freeThreshold) : null,
      s.estDays || null, s.enabled === false ? 0 : 1, Number(s.sortOrder) || 100
    );
  logAction(req.admin!.username, 'shipping.create', id);
  res.status(201).json({ id });
});

router.put('/:id', requireAdmin, (req: AuthRequest, res) => {
  const s = req.body;
  db.prepare(`UPDATE shipping_methods SET
    name = ?, countries = ?, currency = ?, flat_fee = ?, free_threshold = ?, est_days = ?, enabled = ?, sort_order = ?
    WHERE id = ?`).run(
      JSON.stringify(s.name || {}),
      JSON.stringify(Array.isArray(s.countries) && s.countries.length ? s.countries : ['*']),
      s.currency, Number(s.flatFee) || 0,
      s.freeThreshold !== undefined && s.freeThreshold !== null ? Number(s.freeThreshold) : null,
      s.estDays || null, s.enabled === false ? 0 : 1, Number(s.sortOrder) || 100,
      req.params.id
    );
  logAction(req.admin!.username, 'shipping.update', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM shipping_methods WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'shipping.delete', req.params.id);
  res.json({ ok: true });
});

export default router;
