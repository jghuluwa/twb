/**
 * CMS pages — privacy, terms, FAQ, return policy, custom.
 *
 *   GET    /api/pages                 — public list (for footer)
 *   GET    /api/pages/:slug           — public single
 *   GET    /api/pages/admin/all       — admin list
 *   PUT    /api/pages/:slug           — admin upsert
 *   DELETE /api/pages/:slug           — admin delete
 */
import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';

const router = Router();

interface PageRow {
  slug: string; title: string; body_html: string;
  show_in_footer: number; sort_order: number; updated_at: string;
}

function safe(s: string) { try { return JSON.parse(s); } catch { return { en: '', zh: '', 'zh-tw': '' }; } }

function rowToDto(r: PageRow) {
  return {
    slug: r.slug, title: safe(r.title), bodyHtml: safe(r.body_html),
    showInFooter: !!r.show_in_footer, sortOrder: r.sort_order, updatedAt: r.updated_at
  };
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM pages WHERE show_in_footer = 1 ORDER BY sort_order').all() as PageRow[];
  res.json(rows.map(rowToDto));
});

router.get('/admin/all', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM pages ORDER BY sort_order').all() as PageRow[];
  res.json(rows.map(rowToDto));
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug) as PageRow | undefined;
  if (!row) { res.status(404).json({ error: 'not found' }); return; }
  res.json(rowToDto(row));
});

router.put('/:slug', requireAdmin, (req: AuthRequest, res) => {
  const p = req.body;
  const slug = req.params.slug.toLowerCase();
  db.prepare(`INSERT INTO pages (slug, title, body_html, show_in_footer, sort_order, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title, body_html = excluded.body_html,
      show_in_footer = excluded.show_in_footer, sort_order = excluded.sort_order,
      updated_at = datetime('now')`).run(
      slug, JSON.stringify(p.title || {}), JSON.stringify(p.bodyHtml || {}),
      p.showInFooter === false ? 0 : 1, Number(p.sortOrder) || 100
    );
  logAction(req.admin!.username, 'page.update', slug);
  res.json({ ok: true });
});

router.delete('/:slug', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM pages WHERE slug = ?').run(req.params.slug.toLowerCase());
  logAction(req.admin!.username, 'page.delete', req.params.slug);
  res.json({ ok: true });
});

export default router;
