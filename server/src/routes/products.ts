import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, type AuthRequest } from '../lib/auth.js';
import { logAction } from '../lib/audit.js';
import { rowToProduct, type ProductRow, type ProductDTO } from '../lib/serializers.js';

const router = Router();

// ── Public ──
router.get('/', (_req, res) => {
  const rows = db.prepare(
    'SELECT * FROM products WHERE active = 1 ORDER BY sort_order, id'
  ).all() as ProductRow[];
  res.json(rows.map(rowToProduct));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as ProductRow | undefined;
  if (!row || !row.active) { res.status(404).json({ error: 'not found' }); return; }
  res.json(rowToProduct(row));
});

// ── Admin ──
router.get('/admin/all', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order, id').all() as ProductRow[];
  res.json(rows.map(rowToProduct));
});

function validateProduct(p: Partial<ProductDTO>): string | null {
  if (!p.id || typeof p.id !== 'string') return '产品 ID 不能为空';
  if (!['protective', 'underwear', 'special'].includes(p.category as string)) return '分类无效';
  if (typeof p.priceCNY !== 'number' || p.priceCNY < 0) return 'CNY 价格无效';
  if (typeof p.priceUSD !== 'number' || p.priceUSD < 0) return 'USD 价格无效';
  return null;
}

router.post('/', requireAdmin, (req: AuthRequest, res) => {
  const p = req.body as ProductDTO;
  const err = validateProduct(p);
  if (err) { res.status(400).json({ error: err }); return; }
  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(p.id);
  if (exists) { res.status(409).json({ error: '产品 ID 已存在' }); return; }
  db.prepare(`
    INSERT INTO products
      (id, category, price_usd, price_cny, sizes, colors, images,
       name, tagline, description, recommended_use, details,
       stock, low_stock_threshold, featured, seo_title, seo_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    p.id, p.category, p.priceUSD, p.priceCNY,
    JSON.stringify(p.sizes || []),
    JSON.stringify(p.colors || []),
    JSON.stringify(p.images || []),
    JSON.stringify(p.name || {}),
    JSON.stringify(p.tagline || {}),
    JSON.stringify(p.description || {}),
    JSON.stringify(p.recommendedUse || {}),
    JSON.stringify(p.details || {}),
    p.stock === undefined ? null : (p.stock === null ? null : Number(p.stock)),
    p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 5,
    p.featured ? 1 : 0,
    p.seoTitle || null,
    p.seoDescription || null
  );
  logAction(req.admin!.username, 'product.create', p.id);
  res.status(201).json({ ok: true });
});

router.put('/:id', requireAdmin, (req: AuthRequest, res) => {
  const p = req.body as ProductDTO;
  if (!p) { res.status(400).json({ error: '参数无效' }); return; }
  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(req.params.id);
  if (!exists) { res.status(404).json({ error: 'not found' }); return; }
  db.prepare(`
    UPDATE products SET
      category = ?, price_usd = ?, price_cny = ?,
      sizes = ?, colors = ?, images = ?,
      name = ?, tagline = ?, description = ?, recommended_use = ?, details = ?,
      stock = ?, low_stock_threshold = ?, featured = ?, seo_title = ?, seo_description = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    p.category, p.priceUSD, p.priceCNY,
    JSON.stringify(p.sizes || []),
    JSON.stringify(p.colors || []),
    JSON.stringify(p.images || []),
    JSON.stringify(p.name || {}),
    JSON.stringify(p.tagline || {}),
    JSON.stringify(p.description || {}),
    JSON.stringify(p.recommendedUse || {}),
    JSON.stringify(p.details || {}),
    p.stock === undefined ? null : (p.stock === null ? null : Number(p.stock)),
    p.lowStockThreshold !== undefined ? Number(p.lowStockThreshold) : 5,
    p.featured ? 1 : 0,
    p.seoTitle || null,
    p.seoDescription || null,
    req.params.id
  );
  logAction(req.admin!.username, 'product.update', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  logAction(req.admin!.username, 'product.delete', req.params.id);
  res.json({ ok: true });
});

// Inventory dashboard helper: low-stock list
router.get('/admin/low-stock', requireAdmin, (_req, res) => {
  const rows = db.prepare(`SELECT * FROM products
    WHERE stock IS NOT NULL AND stock <= low_stock_threshold ORDER BY stock ASC`).all() as ProductRow[];
  res.json(rows.map(rowToProduct));
});

export default router;
