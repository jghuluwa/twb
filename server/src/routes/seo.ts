/**
 * SEO endpoints:
 *   GET /robots.txt   — allows search + AI crawlers, points to the sitemap
 *   GET /sitemap.xml  — homepage + products + pages, one entry per language
 *                       with hreflang alternates (no hash URLs, no dead links)
 */
import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const LANGS = ['zh', 'zh-tw', 'en', 'ja', 'ko'] as const;
const HREFLANG: Record<string, string> = {
  zh: 'zh-Hans', 'zh-tw': 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko'
};
const DEFAULT_LANG = 'zh';

function baseUrl(): string {
  return (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:8080';
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

router.get('/robots.txt', (_req, res) => {
  const url = baseUrl();
  res.type('text/plain').send(
`# Therabo — search + AI crawlers welcome
User-agent: *
Allow: /
Disallow: /api/
Disallow: /*/account

# AI / LLM crawlers — explicitly allowed for indexing & knowledge bases
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Bytespider
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: Baiduspider
Allow: /

Sitemap: ${url}/sitemap.xml
`);
});

router.get('/sitemap.xml', (_req, res) => {
  const url = baseUrl();
  const products = db.prepare('SELECT id, updated_at FROM products WHERE active = 1').all() as
    Array<{ id: string; updated_at: string }>;
  const pages = db.prepare('SELECT slug, updated_at FROM pages').all() as
    Array<{ slug: string; updated_at: string }>;

  // Build one <url> per language, each listing all language alternates.
  const entry = (pathFor: (lang: string) => string, lastmod?: string, priority = '0.8') => {
    const lines: string[] = [];
    for (const lang of LANGS) {
      const alts = LANGS.map(
        (l) => `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${xml(url + pathFor(l))}"/>`
      ).join('');
      const xdef = `<xhtml:link rel="alternate" hreflang="x-default" href="${xml(url + pathFor(DEFAULT_LANG))}"/>`;
      lines.push(
        `<url><loc>${xml(url + pathFor(lang))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>${priority}</priority>${alts}${xdef}</url>`
      );
    }
    return lines.join('\n');
  };

  const items: string[] = [];
  items.push(entry((lang) => `/${lang}/`, undefined, '1.0'));
  for (const p of products) {
    items.push(entry((lang) => `/${lang}/product/${encodeURIComponent(p.id)}`, p.updated_at?.slice(0, 10), '0.8'));
  }
  for (const pg of pages) {
    items.push(entry((lang) => `/${lang}/page/${encodeURIComponent(pg.slug)}`, pg.updated_at?.slice(0, 10), '0.4'));
  }

  res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${items.join('\n')}
</urlset>`);
});

export default router;
