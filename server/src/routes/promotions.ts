/**
 * Promotions — homepage popups & sticky top banners.
 *   GET  /api/promotions/active   — public: returns enabled promos in window
 *   GET  /api/promotions          — admin: full list
 *   POST /api/promotions          — admin: create
 *   PUT  /api/promotions/:id      — admin: update
 *   DELETE /api/promotions/:id    — admin: delete
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

interface PromotionRow {
  id: string; kind: string; enabled: number;
  title: string; body: string; cta_label: string | null; cta_url: string | null;
  image_url: string | null; background: string | null; text_color: string | null;
  start_at: string | null; end_at: string | null;
  show_once: number; priority: number; created_at: string;
}

function safeJSON(s: string | null) {
  if (!s) return { en: '', zh: '', 'zh-tw': '' };
  try { return JSON.parse(s); } catch { return { en: '', zh: '', 'zh-tw': '' }; }
}

function rowToDto(r: PromotionRow) {
  return {
    id: r.id, kind: r.kind, enabled: !!r.enabled,
    title: safeJSON(r.title), body: safeJSON(r.body),
    ctaLabel: r.cta_label ? safeJSON(r.cta_label) : null,
    ctaUrl: r.cta_url || null,
    imageUrl: r.image_url || null,
    background: r.background || null,
    textColor: r.text_color || null,
    startAt: r.start_at || null,
    endAt: r.end_at || null,
    showOnce: !!r.show_once,
    priority: r.priority,
    createdAt: r.created_at
  };
}

function newId(): string {
  return 'PROMO-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function isInWindow(r: PromotionRow): boolean {
  const now = Date.now();
  if (r.start_at && new Date(r.start_at).getTime() > now) return false;
  if (r.end_at && new Date(r.end_at).getTime() < now) return false;
  return true;
}

// Public: what to show on the storefront right now
router.get('/active', (_req, res) => {
  const rows = db.prepare('SELECT * FROM promotions WHERE enabled = 1 ORDER BY priority DESC').all() as PromotionRow[];
  res.json(rows.filter(isInWindow).map(rowToDto));
});

// Admin
router.get('/', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM promotions ORDER BY priority DESC, created_at DESC').all() as PromotionRow[];
  res.json(rows.map(rowToDto));
});

router.post('/', requireAdmin, (req: AuthRequest, res) => {
  const p = req.body;
  if (!['popup', 'topbar'].includes(p.kind)) { res.status(400).json({ error: '类型无效' }); return; }
  const id = newId();
  db.prepare(`INSERT INTO promotions
    (id, kind, enabled, title, body, cta_label, cta_url, image_url, background, text_color, start_at, end_at, show_once, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, p.kind, p.enabled ? 1 : 0,
      JSON.stringify(p.title || {}), JSON.stringify(p.body || {}),
      p.ctaLabel ? JSON.stringify(p.ctaLabel) : null,
      p.ctaUrl || null, p.imageUrl || null,
      p.background || null, p.textColor || null,
      p.startAt || null, p.endAt || null,
      p.showOnce === false ? 0 : 1, Number(p.priority) || 100
    );
  logAction(req.admin!.username, 'promotion.create', id);
  res.status(201).json({ id });
});

router.put('/:id', requireAdmin, (req: AuthRequest, res) => {
  const p = req.body;
  db.prepare(`UPDATE promotions SET
    kind = ?, enabled = ?, title = ?, body = ?, cta_label = ?, cta_url = ?,
    image_url = ?, background = ?, text_color = ?, start_at = ?, end_at = ?,
    show_once = ?, priority = ?
    WHERE id = ?`).run(
      p.kind, p.enabled ? 1 : 0,
      JSON.stringify(p.title || {}), JSON.stringify(p.body || {}),
      p.ctaLabel ? JSON.stringify(p.ctaLabel) : null,
      p.ctaUrl || null, p.imageUrl || null,
      p.background || null, p.textColor || null,
      p.startAt || null, p.endAt || null,
      p.showOnce === false ? 0 : 1, Number(p.priority) || 100,
      req.params.id
    );
  logAction(req.admin!.username, 'promotion.update', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'promotion.delete', req.params.id);
  res.json({ ok: true });
});

export default router;
