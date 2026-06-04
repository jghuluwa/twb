/**
 * Product reviews — customer submits, admin approves/rejects.
 *
 *   GET  /api/reviews?productId=...   — public: only approved reviews
 *   POST /api/reviews                 — public (or logged-in): submit, status='pending'
 *   GET  /api/reviews/admin           — admin: all reviews, optional status filter
 *   PATCH /api/reviews/admin/:id      — admin: change status
 *   DELETE /api/reviews/admin/:id     — admin: delete
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

interface ReviewRow {
  id: string; product_id: string; customer_id: string | null;
  author_name: string; author_email: string | null;
  rating: number; title: string | null; body: string; language: string | null;
  status: string; created_at: string;
}

function rowToDto(r: ReviewRow) {
  return {
    id: r.id, productId: r.product_id, customerId: r.customer_id || undefined,
    authorName: r.author_name, authorEmail: r.author_email || undefined,
    rating: r.rating, title: r.title || undefined,
    body: r.body, language: r.language || undefined,
    status: r.status, createdAt: r.created_at
  };
}

router.get('/', (req, res) => {
  const productId = req.query.productId ? String(req.query.productId) : null;
  const rows = productId
    ? db.prepare("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC").all(productId)
    : db.prepare("SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 50").all();
  res.json((rows as ReviewRow[]).map(rowToDto));
});

router.post('/', (req: AuthRequest, res) => {
  const { productId, authorName, authorEmail, rating, title, body, language } = req.body ?? {};
  if (!productId || !authorName || !body) { res.status(400).json({ error: '请填写姓名与内容' }); return; }
  const r = Math.max(1, Math.min(5, Number(rating) || 5));
  const id = 'REV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  db.prepare(`INSERT INTO reviews (id, product_id, customer_id, author_name, author_email, rating, title, body, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, productId, req.customer?.customerId || null,
      String(authorName).trim(), authorEmail || null, r,
      title || null, String(body).trim(), language || null);
  res.status(201).json({ id, status: 'pending' });
});

router.get('/admin', requireAdmin, (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const rows = status
    ? db.prepare('SELECT * FROM reviews WHERE status = ? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500').all();
  res.json((rows as ReviewRow[]).map(rowToDto));
});

router.patch('/admin/:id', requireAdmin, (req: AuthRequest, res) => {
  const { status } = req.body ?? {};
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: '状态无效' }); return;
  }
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
  logAction(req.admin!.username, 'review.status', req.params.id, { status });
  res.json({ ok: true });
});

router.delete('/admin/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'review.delete', req.params.id);
  res.json({ ok: true });
});

export default router;
