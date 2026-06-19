import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';

import { attachAuth } from './lib/auth.js';
import adminAuth from './routes/admin-auth.js';
import products from './routes/products.js';
import content from './routes/content.js';
import customers from './routes/customers.js';
import orders from './routes/orders.js';
import uploads from './routes/uploads.js';
import payments, { stripeWebhookHandler } from './routes/payments.js';
import promotions from './routes/promotions.js';
import discounts from './routes/discounts.js';
import emails from './routes/emails.js';
import shipping from './routes/shipping.js';
import reviews from './routes/reviews.js';
import pages from './routes/pages.js';
import settings from './routes/settings.js';
import audit from './routes/audit.js';
import seo from './routes/seo.js';
import contact from './routes/contact.js';
import analytics from './routes/analytics.js';
import { renderHtml } from './lib/seo-render.js';

const app = express();
const PORT = Number(process.env.PORT || 8080);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const STATIC_DIR = process.env.STATIC_DIR || path.join(process.cwd(), 'public');

// CORS — only meaningful in dev when Vite serves the frontend on :3000
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(cookieParser());

// Stripe webhook needs the raw body, so register it BEFORE the JSON parser.
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '2mb' }));
app.use(attachAuth);

// API routes
app.use('/api/admin', adminAuth);
app.use('/api/products', products);
app.use('/api/content', content);
app.use('/api/customers', customers);
app.use('/api/orders', orders);
app.use('/api/uploads', uploads);
app.use('/api/payments', payments);
app.use('/api/promotions', promotions);
app.use('/api/discounts', discounts);
app.use('/api/emails', emails);
app.use('/api/shipping', shipping);
app.use('/api/reviews', reviews);
app.use('/api/pages', pages);
app.use('/api/settings', settings);
app.use('/api/audit', audit);
app.use('/api/contact', contact);
app.use('/api/analytics', analytics);

// SEO (root-level paths)
app.use('/', seo);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Serve uploaded images
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', immutable: true }));

// Serve built frontend (production single-process mode)
if (fs.existsSync(STATIC_DIR)) {
  app.use(express.static(STATIC_DIR, { maxAge: '1h' }));
  const INDEX_HTML = path.join(STATIC_DIR, 'index.html');
  // SPA fallback — anything not /api or /uploads returns index.html, rewritten
  // per-route with SEO meta, JSON-LD and a no-JS content snapshot so crawlers
  // (incl. Baidu / AI bots that don't run JS) index real, localized content.
  app.get(/^(?!\/api|\/uploads|\/sitemap\.xml|\/robots\.txt|\/llms).*/, (req, res) => {
    try {
      const template = fs.readFileSync(INDEX_HTML, 'utf8');
      res.type('html').send(renderHtml(template, req.path));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[therabo] SEO render failed, serving static index:', err);
      res.sendFile(INDEX_HTML);
    }
  });
}

// Centralized error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('[therabo] unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: err instanceof Error ? err.message : 'server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[therabo] server listening on :${PORT}`);
});
