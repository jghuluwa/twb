/**
 * Seed script — populates SQLite with:
 *   1. Default admin user (from ADMIN_BOOTSTRAP_USERNAME / ADMIN_BOOTSTRAP_PASSWORD)
 *   2. The 16 seed products from the frontend src/data/products.ts
 *   3. Default site content (hero / about / contact)
 *
 * Idempotent: re-running will NOT duplicate. It only inserts if the row is missing.
 */
import 'dotenv/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { db } from './db.js';
import { hashPassword } from './lib/auth.js';
import { seedDefaultTemplates } from './lib/email.js';

async function loadFrontendProducts() {
  // tsx loader resolves .ts modules at runtime, letting us import the existing
  // catalog directly. After `npm run build` this path resolves from dist/.
  const candidates = [
    path.resolve(process.cwd(), '../src/data/products.ts'),
    path.resolve(process.cwd(), 'src/data/products.ts')
  ];
  for (const p of candidates) {
    try {
      const mod = await import(pathToFileURL(p).href);
      if (mod.products) return mod.products as Array<Record<string, unknown>>;
    } catch {
      // try next
    }
  }
  console.warn('[seed] could not load frontend products.ts — products table left empty');
  return [];
}

const defaultContent = {
  hero: {
    badge: {
      en: '🌟 1998 Nobel Prize Medical Breakthrough Application',
      zh: '🌟 基于1998年诺贝尔生理学或医学奖理论转化应用',
      ja: '🌟 1998年ノーベル生理学・医学賞理論の応用',
      ko: '🌟 1998년 노벨 생리의학상 이론의 응용',
      'zh-tw': '🌟 基於1998年諾貝爾生理學或醫學獎理論轉化應用'
    },
    headline: {
      en: 'Unlocking Natural Nitric Oxide Through Intelligent Wearables',
      zh: '穿戴出的自体一氧化氮，让气血自由畅通',
      ja: '着ることで、体内の一酸化窒素を自然に引き出す',
      ko: '착용으로 체내 일산화질소를 자연스럽게 활성화',
      'zh-tw': '穿戴出的自體一氧化氮，讓氣血自由暢通'
    },
    subheading: {
      en: 'PHOTEX biothermal wearables stimulate endogenous Nitric Oxide synthesis. No chemicals. No drugs.',
      zh: '通微宝 PHOTEX 太赫兹科技面料，非药非补，纯物理共振激发人体自体一氧化氮。',
      ja: 'Therabo PHOTEXテクノロジーは、薬剤を使わずに体内の一酸化窒素生成を促します。',
      ko: 'Therabo PHOTEX 기술은 약물 없이 체내 일산화질소 생성을 촉진합니다.',
      'zh-tw': '通微寶 PHOTEX 太赫茲科技面料，非藥非補，純物理共振激發人體自體一氧化氮。'
    },
    heroImage: ''
  },
  about: {
    title: {
      en: 'About Therabo',
      zh: '关于通微宝',
      ja: 'Theraboについて',
      ko: 'Therabo 소개',
      'zh-tw': '關於通微寶'
    },
    body: {
      en: 'Beijing Zhongke Medical Materials Co., Ltd. — a national-grade biomedical materials innovator focusing on endogenous Nitric Oxide stimulation.',
      zh: '北京中科医用材料有限公司，国家级生物医用材料创新企业，专注内源性一氧化氮激发技术。',
      ja: 'Theraboは、内因性一酸化窒素の活性化技術に注力するバイオメディカル材料イノベーターです。',
      ko: 'Therabo는 내인성 일산화질소 활성화 기술에 집중하는 바이오메디컬 소재 혁신 기업입니다.',
      'zh-tw': '北京中科醫用材料有限公司，國家級生物醫用材料創新企業，專注內源性一氧化氮激發技術。'
    },
    aboutImage: ''
  },
  contactEmail: 'liufei@therabo.top',
  contactPhone: '4009010913'
};

async function main() {
  // 1. Admin bootstrap
  const adminCount = (db.prepare('SELECT COUNT(*) AS n FROM admin_users').get() as { n: number }).n;
  if (adminCount === 0) {
    const username = process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin';
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'changeme-now';
    const hash = await hashPassword(password);
    db.prepare(
      'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)'
    ).run(username, hash, 'admin');
    console.log(`[seed] bootstrapped admin user "${username}" — CHANGE THE PASSWORD ON FIRST LOGIN`);
    if (!process.env.ADMIN_BOOTSTRAP_PASSWORD) {
      console.log('[seed] (no ADMIN_BOOTSTRAP_PASSWORD set — default is "changeme-now")');
    }
  } else {
    console.log(`[seed] admin users already exist (${adminCount}) — skipping bootstrap`);
  }

  // 2. Products
  const prodCount = (db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number }).n;
  if (prodCount === 0) {
    const products = await loadFrontendProducts();
    const insert = db.prepare(`
      INSERT INTO products
        (id, category, price_usd, price_cny, sizes, colors, images,
         name, tagline, description, recommended_use, details, sort_order)
      VALUES
        (@id, @category, @priceUSD, @priceCNY, @sizes, @colors, @images,
         @name, @tagline, @description, @recommendedUse, @details, @sortOrder)
    `);
    const tx = db.transaction((rows: Array<Record<string, unknown>>) => {
      rows.forEach((p, idx) => {
        insert.run({
          id: p.id,
          category: p.category,
          priceUSD: p.priceUSD,
          priceCNY: p.priceCNY,
          sizes: JSON.stringify(p.sizes ?? []),
          colors: JSON.stringify(p.colors ?? []),
          images: JSON.stringify([]),
          name: JSON.stringify(p.name),
          tagline: JSON.stringify(p.tagline),
          description: JSON.stringify(p.description),
          recommendedUse: JSON.stringify(p.recommendedUse),
          details: JSON.stringify(p.details),
          sortOrder: (idx + 1) * 10
        });
      });
    });
    tx(products);
    console.log(`[seed] inserted ${products.length} products`);
  } else {
    console.log(`[seed] products table not empty (${prodCount}) — skipping`);
  }

  // 3. Site content
  const has = db.prepare('SELECT id FROM site_content WHERE id = 1').get();
  if (!has) {
    db.prepare('INSERT INTO site_content (id, payload) VALUES (1, ?)').run(JSON.stringify(defaultContent));
    console.log('[seed] inserted default site content');
  } else {
    console.log('[seed] site content already exists — skipping');
  }

  // 4. Email templates
  seedDefaultTemplates();
  console.log('[seed] email templates ensured');

  // 5. Default shipping method (free over 999 in CNY; flat $20 over 200 free for USD)
  const shipCount = (db.prepare('SELECT COUNT(*) AS n FROM shipping_methods').get() as { n: number }).n;
  if (shipCount === 0) {
    db.prepare(`INSERT INTO shipping_methods (id, name, countries, currency, flat_fee, free_threshold, est_days, sort_order)
      VALUES (?, ?, ?, 'CNY', 0, 0, '3-5', 10)`).run(
        'SHIP-CN', JSON.stringify({ zh: '国内顺丰快递', ja: '中国国内配送', ko: '중국 국내 배송', 'zh-tw': '中國順豐快遞', en: 'Domestic Express' }),
        JSON.stringify(['China', '中国', '中国大陆'])
      );
    db.prepare(`INSERT INTO shipping_methods (id, name, countries, currency, flat_fee, free_threshold, est_days, sort_order)
      VALUES (?, ?, ?, 'USD', 20, 200, '7-14', 20)`).run(
        'SHIP-INTL', JSON.stringify({ zh: '国际航空件', ja: '国際航空便', ko: '국제 항공 배송', 'zh-tw': '國際航空件', en: 'International Air Shipping' }),
        JSON.stringify(['*'])
      );
    console.log('[seed] inserted default shipping methods');
  }

  // 6. Default CMS pages
  const pageCount = (db.prepare('SELECT COUNT(*) AS n FROM pages').get() as { n: number }).n;
  if (pageCount === 0) {
    const pages = [
      { slug: 'privacy', sort: 10, title: { zh: '隐私政策', ja: 'プライバシーポリシー', ko: '개인정보 처리방침', 'zh-tw': '隱私政策', en: 'Privacy Policy' },
        body: { zh: '<p>请在管理后台编辑此页面的内容。</p>', ja: '<p>管理画面でこのページを編集してください。</p>', ko: '<p>관리자 화면에서 이 페이지를 편집해 주세요.</p>', 'zh-tw': '<p>請在管理後台編輯此頁面內容。</p>', en: '<p>Please edit this page from the admin console.</p>' } },
      { slug: 'terms', sort: 20, title: { zh: '服务条款', ja: '利用規約', ko: '서비스 약관', 'zh-tw': '服務條款', en: 'Terms of Service' },
        body: { zh: '<p>请在管理后台编辑此页面的内容。</p>', ja: '<p>管理画面でこのページを編集してください。</p>', ko: '<p>관리자 화면에서 이 페이지를 편집해 주세요.</p>', 'zh-tw': '<p>請在管理後台編輯此頁面內容。</p>', en: '<p>Please edit this page from the admin console.</p>' } },
      { slug: 'faq', sort: 30, title: { zh: '常见问题', ja: 'よくある質問', ko: '자주 묻는 질문', 'zh-tw': '常見問題', en: 'FAQ' },
        body: { zh: '<p>请在管理后台编辑此页面的内容。</p>', ja: '<p>管理画面でこのページを編集してください。</p>', ko: '<p>관리자 화면에서 이 페이지를 편집해 주세요.</p>', 'zh-tw': '<p>請在管理後台編輯此頁面內容。</p>', en: '<p>Please edit this page from the admin console.</p>' } },
      { slug: 'returns', sort: 40, title: { zh: '退换货政策', ja: '返品・返金ポリシー', ko: '반품 및 환불 정책', 'zh-tw': '退換貨政策', en: 'Returns & Refunds' },
        body: { zh: '<p>请在管理后台编辑此页面的内容。</p>', ja: '<p>管理画面でこのページを編集してください。</p>', ko: '<p>관리자 화면에서 이 페이지를 편집해 주세요.</p>', 'zh-tw': '<p>請在管理後台編輯此頁面內容。</p>', en: '<p>Please edit this page from the admin console.</p>' } }
    ];
    const stmt = db.prepare(`INSERT INTO pages (slug, title, body_html, show_in_footer, sort_order) VALUES (?, ?, ?, 1, ?)`);
    for (const p of pages) stmt.run(p.slug, JSON.stringify(p.title), JSON.stringify(p.body), p.sort);
    console.log('[seed] inserted default CMS pages');
  }

  console.log('[seed] done.');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
