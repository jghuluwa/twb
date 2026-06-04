import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

router.post('/', (req, res) => {
  const { name, nationality, phone, email, intent, language } = req.body ?? {};
  if (![name, nationality, phone, email, intent].every((v) => typeof v === 'string' && v.trim())) {
    res.status(400).json({ error: '请完整填写联系信息' }); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: '邮箱格式无效' }); return;
  }
  const id = `INQ-${randomBytes(5).toString('hex').toUpperCase()}`;
  db.prepare(`INSERT INTO contact_inquiries
    (id, name, nationality, phone, email, intent, language)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, name.trim(), nationality.trim(), phone.trim(), email.trim().toLowerCase(), intent.trim(), language || null);
  res.status(201).json({ id, ok: true });
});

router.get('/admin', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT id, name, nationality, phone, email, intent, language,
    status, created_at AS createdAt, updated_at AS updatedAt
    FROM contact_inquiries ORDER BY created_at DESC`).all();
  res.json(rows);
});

router.patch('/admin/:id', requireAdmin, (req: AuthRequest, res) => {
  const status = String(req.body?.status || '');
  if (!['new', 'contacted', 'closed'].includes(status)) {
    res.status(400).json({ error: '状态无效' }); return;
  }
  db.prepare(`UPDATE contact_inquiries SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, req.params.id);
  logAction(req.admin!.username, 'contact.update', req.params.id, { status });
  res.json({ ok: true });
});

router.delete('/admin/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM contact_inquiries WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'contact.delete', req.params.id);
  res.json({ ok: true });
});

export default router;
