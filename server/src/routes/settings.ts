/**
 * Site-wide settings (brand colors, logo, social links, FX rates, maintenance mode, etc).
 *
 *   GET  /api/settings              — public: returns ALL keys (no secrets here)
 *   GET  /api/settings/:key         — public
 *   PUT  /api/settings/:key         — admin
 *
 * Each value is a JSON blob.
 *
 * Reserved keys NOT exposed publicly: 'smtp' (handled in emails.ts)
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

const SECRET_KEYS = new Set(['smtp']);

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    if (SECRET_KEYS.has(r.key)) continue;
    try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = r.value; }
  }
  res.json(out);
});

router.get('/:key', (req, res) => {
  if (SECRET_KEYS.has(req.params.key)) { res.status(403).json({ error: 'forbidden' }); return; }
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key) as { value: string } | undefined;
  if (!row) { res.json(null); return; }
  try { res.json(JSON.parse(row.value)); } catch { res.json(row.value); }
});

router.put('/:key', requireAdmin, (req: AuthRequest, res) => {
  const value = JSON.stringify(req.body ?? null);
  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(req.params.key, value);
  logAction(req.admin!.username, 'settings.update', req.params.key);
  res.json({ ok: true });
});

export default router;
