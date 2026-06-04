/**
 * SEO endpoints:
 *   GET /robots.txt        — static-ish, points to sitemap
 *   GET /sitemap.xml       — dynamic: homepage + all active products + all pages
 */
import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function baseUrl(): string {
  return (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:8080';
}

router.get('/robots.txt', (_req, res) => {
  const url = baseUrl();
  res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /api/
Disallow: /#admin
Sitemap: ${url}/sitemap.xml
`);
});

router.get('/sitemap.xml', (_req, res) => {
  const url = baseUrl();
  const products = db.prepare('SELECT id, updated_at FROM products WHERE active = 1').all() as
    Array<{ id: string; updated_at: string }>;
  const pages = db.prepare('SELECT slug, updated_at FROM pages').all() as
    Array<{ slug: string; updated_at: string }>;
  const items: string[] = [];
  items.push(`<url><loc>${url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  for (const p of products) {
    items.push(`<url><loc>${url}/#product/${p.id}</loc><lastmod>${p.updated_at.slice(0, 10)}</lastmod><priority>0.8</priority></url>`);
  }
  for (const pg of pages) {
    items.push(`<url><loc>${url}/#page/${pg.slug}</loc><lastmod>${pg.updated_at.slice(0, 10)}</lastmod><priority>0.4</priority></url>`);
  }
  res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</urlset>`);
});

export default router;
