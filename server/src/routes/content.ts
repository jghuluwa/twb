import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../lib/auth.js';

const router = Router();

router.get('/', (_req, res) => {
  const row = db.prepare('SELECT payload FROM site_content WHERE id = 1').get() as { payload: string } | undefined;
  if (!row) { res.json({}); return; }
  try { res.json(JSON.parse(row.payload)); }
  catch { res.json({}); }
});

router.put('/', requireAdmin, (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') { res.status(400).json({ error: '参数无效' }); return; }
  db.prepare(`
    INSERT INTO site_content (id, payload) VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
  `).run(JSON.stringify(payload));
  res.json({ ok: true });
});

export default router;
