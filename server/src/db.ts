import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'therabo.db');

fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  category     TEXT NOT NULL,
  price_usd    REAL NOT NULL,
  price_cny    REAL NOT NULL,
  sizes        TEXT NOT NULL,          -- JSON array
  colors       TEXT NOT NULL,          -- JSON array of {name, hex}
  images       TEXT NOT NULL DEFAULT '[]', -- JSON array of image URLs
  name         TEXT NOT NULL,          -- JSON {en, zh, zh-tw}
  tagline      TEXT NOT NULL,
  description  TEXT NOT NULL,
  recommended_use TEXT NOT NULL,
  details      TEXT NOT NULL,          -- JSON {en:[], zh:[], zh-tw:[]}
  sort_order   INTEGER NOT NULL DEFAULT 100,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  username      TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','editor')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  phone          TEXT,
  country        TEXT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at  TEXT
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  recipient     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  country       TEXT NOT NULL,
  address       TEXT NOT NULL,
  is_default    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,           -- THB-YYYYMMDD-NNNN
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','shipped','completed','cancelled')),
  currency        TEXT NOT NULL CHECK (currency IN ('USD','CNY')),
  subtotal        REAL NOT NULL,
  customer_id     TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_email  TEXT NOT NULL,
  customer_phone  TEXT,
  customer_country TEXT NOT NULL,
  customer_address TEXT,
  note            TEXT,
  payment_method  TEXT,                       -- stripe | alipay | wechat | manual
  payment_ref     TEXT,                       -- provider's session/transaction id
  paid_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id             TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id           TEXT NOT NULL,
  product_name         TEXT NOT NULL,
  selected_size        TEXT NOT NULL,
  selected_color_name  TEXT NOT NULL,
  selected_color_hex   TEXT NOT NULL,
  quantity             INTEGER NOT NULL,
  unit_price           REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS site_content (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  payload  TEXT NOT NULL                       -- JSON SiteContent
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── Inventory & shipping fields on products ──
-- Older databases don't have these columns; the migration block below adds
-- them defensively.

-- Marketing: homepage popups, sticky top banners, promo content
CREATE TABLE IF NOT EXISTS promotions (
  id           TEXT PRIMARY KEY,                 -- PROMO-xxxxxx
  kind         TEXT NOT NULL CHECK (kind IN ('popup','topbar')),
  enabled      INTEGER NOT NULL DEFAULT 1,
  title        TEXT NOT NULL,                    -- JSON {en, zh, zh-tw}
  body         TEXT NOT NULL,                    -- JSON i18n
  cta_label    TEXT,                             -- JSON i18n (button text)
  cta_url      TEXT,                             -- destination
  image_url    TEXT,                             -- /uploads/...
  background   TEXT,                             -- hex for topbar
  text_color   TEXT,                             -- hex for topbar
  start_at     TEXT,                             -- ISO; null = always
  end_at       TEXT,                             -- ISO; null = always
  show_once    INTEGER NOT NULL DEFAULT 1,       -- popups only: localStorage gate
  priority     INTEGER NOT NULL DEFAULT 100,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Discount codes / coupons
CREATE TABLE IF NOT EXISTS discount_codes (
  code           TEXT PRIMARY KEY,                -- uppercased; e.g. WELCOME10
  kind           TEXT NOT NULL CHECK (kind IN ('percent','fixed','free_shipping')),
  amount         REAL NOT NULL DEFAULT 0,         -- 10 = 10%; 100 = 100 of currency; ignored for free_shipping
  currency       TEXT,                            -- null = any; 'CNY' / 'USD'
  min_subtotal   REAL NOT NULL DEFAULT 0,
  starts_at      TEXT,
  ends_at        TEXT,
  max_uses       INTEGER,                         -- null = unlimited
  uses           INTEGER NOT NULL DEFAULT 0,
  active         INTEGER NOT NULL DEFAULT 1,
  description    TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email templates (system + marketing)
CREATE TABLE IF NOT EXISTS email_templates (
  id           TEXT PRIMARY KEY,                  -- e.g. order_confirmation, welcome, custom-xxxx
  name         TEXT NOT NULL,
  subject      TEXT NOT NULL,
  body_html    TEXT NOT NULL,                     -- supports {{variables}}
  kind         TEXT NOT NULL CHECK (kind IN ('system','marketing')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bulk email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id           TEXT PRIMARY KEY,                  -- CAMP-xxxxxx
  name         TEXT NOT NULL,
  template_id  TEXT REFERENCES email_templates(id) ON DELETE SET NULL,
  subject      TEXT NOT NULL,
  body_html    TEXT NOT NULL,
  audience     TEXT NOT NULL,                     -- JSON {kind:'all_customers'|'registered'|'subscribers'|'recent_buyers', days?: number}
  status       TEXT NOT NULL CHECK (status IN ('draft','sending','sent','failed')) DEFAULT 'draft',
  sent_count   INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TEXT,
  sent_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Email send log (audit + dedupe)
CREATE TABLE IF NOT EXISTS email_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  to_addr      TEXT NOT NULL,
  subject      TEXT NOT NULL,
  kind         TEXT NOT NULL,                     -- order_confirmation, welcome, campaign, ...
  campaign_id  TEXT REFERENCES email_campaigns(id) ON DELETE SET NULL,
  order_id     TEXT,
  status       TEXT NOT NULL CHECK (status IN ('sent','failed')),
  error        TEXT,
  sent_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_addr);

-- Newsletter subscribers (footer signup form)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email        TEXT PRIMARY KEY,
  language     TEXT,
  source       TEXT,                              -- 'footer', 'popup', 'checkout'
  confirmed    INTEGER NOT NULL DEFAULT 1,
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Shipping methods (per country flat rate, with free-shipping threshold)
CREATE TABLE IF NOT EXISTS shipping_methods (
  id            TEXT PRIMARY KEY,                 -- SHIP-xxxxxx
  name          TEXT NOT NULL,                    -- JSON i18n
  countries     TEXT NOT NULL,                    -- JSON string[] ('*' = default for everywhere)
  currency      TEXT NOT NULL CHECK (currency IN ('USD','CNY')),
  flat_fee      REAL NOT NULL DEFAULT 0,
  free_threshold REAL,                            -- subtotal >= → free
  est_days      TEXT,                             -- '5-7'
  enabled       INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 100
);

-- Product reviews (customer-submitted, admin-approved)
CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,                  -- REV-xxxxxx
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id  TEXT REFERENCES customers(id) ON DELETE SET NULL,
  author_name  TEXT NOT NULL,
  author_email TEXT,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        TEXT,
  body         TEXT NOT NULL,
  language     TEXT,
  status       TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- CMS pages: privacy, terms, FAQ, return-policy, custom
CREATE TABLE IF NOT EXISTS pages (
  slug         TEXT PRIMARY KEY,                  -- 'privacy', 'terms', 'faq', etc
  title        TEXT NOT NULL,                     -- JSON i18n
  body_html    TEXT NOT NULL,                     -- JSON i18n (raw HTML)
  show_in_footer INTEGER NOT NULL DEFAULT 1,
  sort_order   INTEGER NOT NULL DEFAULT 100,
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit log (every admin write action)
CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           TEXT NOT NULL DEFAULT (datetime('now')),
  actor        TEXT NOT NULL,                     -- admin username
  action       TEXT NOT NULL,                     -- 'product.update', 'order.delete', ...
  target       TEXT,                              -- e.g. product id
  payload      TEXT                               -- JSON snapshot (truncated)
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);

-- Partnership / contact enquiries submitted from the public site
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  nationality  TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT NOT NULL,
  intent       TEXT NOT NULL,
  language     TEXT,
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_inquiries(created_at);

-- Privacy-conscious traffic statistics (no raw IP addresses are retained)
CREATE TABLE IF NOT EXISTS page_views (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  path         TEXT NOT NULL,
  referrer     TEXT,
  language     TEXT,
  device       TEXT,
  country      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
`);

// ── Migrations for older databases that pre-date the new columns ──
function addColumnIfMissing(table: string, column: string, definition: string): void {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!info.find((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
addColumnIfMissing('products', 'stock', 'INTEGER');
addColumnIfMissing('products', 'low_stock_threshold', 'INTEGER NOT NULL DEFAULT 5');
addColumnIfMissing('products', 'featured', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('products', 'seo_title', 'TEXT');
addColumnIfMissing('products', 'seo_description', 'TEXT');
addColumnIfMissing('orders', 'discount_code', 'TEXT');
addColumnIfMissing('orders', 'discount_amount', 'REAL NOT NULL DEFAULT 0');
addColumnIfMissing('orders', 'shipping_method_id', 'TEXT');
addColumnIfMissing('orders', 'shipping_fee', 'REAL NOT NULL DEFAULT 0');
addColumnIfMissing('orders', 'tracking_number', 'TEXT');
addColumnIfMissing('orders', 'shipped_at', 'TEXT');

export function withTransaction<T>(fn: () => T): T {
  const t = db.transaction(fn);
  return t();
}
