/**
 * One-off (idempotent) DB content compliance pass.
 *
 *   npm run sanitize
 *
 * Rewrites the JSON text columns of products + pages through the compliance
 * dictionary so what the API and server-side SEO render actually serve is free
 * of 医疗功效 / 绝对化 用语. Safe to run repeatedly.
 */
import { db } from '../db.js';
import { sanitizeText } from '../lib/compliance.js';

function sanitizeJsonColumn(raw: string | null): { value: string; changed: boolean } {
  if (!raw) return { value: raw ?? '', changed: false };
  const next = sanitizeText(raw); // operate on the raw JSON string; only inner text changes
  return { value: next, changed: next !== raw };
}

let productChanges = 0;
let pageChanges = 0;

const products = db.prepare('SELECT * FROM products').all() as Array<Record<string, unknown>>;
const updateProduct = db.prepare(
  'UPDATE products SET name=?, tagline=?, description=?, recommended_use=?, details=? WHERE id=?'
);
for (const p of products) {
  const cols = ['name', 'tagline', 'description', 'recommended_use', 'details'].map((c) =>
    sanitizeJsonColumn(p[c] as string | null)
  );
  if (cols.some((c) => c.changed)) {
    updateProduct.run(cols[0].value, cols[1].value, cols[2].value, cols[3].value, cols[4].value, p.id);
    productChanges++;
  }
}

const pages = db.prepare('SELECT * FROM pages').all() as Array<Record<string, unknown>>;
const updatePage = db.prepare('UPDATE pages SET title=?, body_html=? WHERE slug=?');
for (const pg of pages) {
  const t = sanitizeJsonColumn(pg.title as string | null);
  const b = sanitizeJsonColumn(pg.body_html as string | null);
  if (t.changed || b.changed) {
    updatePage.run(t.value, b.value, pg.slug);
    pageChanges++;
  }
}

// Admin-editable site content (hero / about / science copy) lives in one JSON row.
let siteContentChanges = 0;
const sc = db.prepare('SELECT payload FROM site_content WHERE id = 1').get() as { payload: string } | undefined;
if (sc) {
  const next = sanitizeJsonColumn(sc.payload);
  if (next.changed) {
    db.prepare('UPDATE site_content SET payload = ? WHERE id = 1').run(next.value);
    siteContentChanges = 1;
  }
}

// eslint-disable-next-line no-console
console.log(`[sanitize] products updated: ${productChanges}, pages updated: ${pageChanges}, site_content updated: ${siteContentChanges}`);
