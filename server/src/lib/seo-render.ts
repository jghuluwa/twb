/**
 * Server-side SEO rendering (pragmatic SSR for a CSR SPA).
 *
 * Baidu Spider and most AI crawlers (Bytespider, GPTBot, ClaudeBot, …) do not
 * reliably execute JavaScript, so the client-side <head> management in
 * src/lib/seo.ts is invisible to them. This module rewrites the built
 * index.html per request with:
 *   - localized <title>, meta description/keywords, canonical, robots
 *   - hreflang alternates for every locale
 *   - Open Graph / Twitter cards
 *   - JSON-LD (Product / BreadcrumbList / FAQPage) on top of the static
 *     Organization + WebSite already in index.html
 *   - a no-JS content snapshot inside #root with answer-first definition
 *     sentences and evidence-grounded facts (GEO-friendly) so RAG scrapers
 *     index real content, not an empty shell.
 *
 * The React app still boots normally for human visitors and replaces #root.
 */
import { db } from '../db.js';
import { rowToProduct, type ProductDTO, type ProductRow, type I18n } from './serializers.js';

type Lang = 'zh' | 'zh-tw' | 'en' | 'ja' | 'ko';
const LANGS: Lang[] = ['zh', 'zh-tw', 'en', 'ja', 'ko'];
const DEFAULT_LANG: Lang = 'zh';
const HREFLANG: Record<Lang, string> = {
  zh: 'zh-Hans', 'zh-tw': 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko'
};
const HTML_LANG: Record<Lang, string> = {
  zh: 'zh-CN', 'zh-tw': 'zh-TW', en: 'en', ja: 'ja', ko: 'ko'
};
const OG_LOCALE: Record<Lang, string> = {
  zh: 'zh_CN', 'zh-tw': 'zh_TW', en: 'en_US', ja: 'ja_JP', ko: 'ko_KR'
};

const SITE_NAME = '通微宝 Therabo';

export function baseUrl(): string {
  return (process.env.APP_URL || '').replace(/\/$/, '') || 'http://localhost:8080';
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickI18n(o: I18n | Record<string, string> | undefined, lang: Lang): string {
  if (!o) return '';
  const r = o as Record<string, string>;
  return r[lang] || r.zh || r.en || Object.values(r)[0] || '';
}

function clip(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
}

// ── Route parsing (mirror of src/lib/router.ts) ──────────────────────────────
type View = 'home' | 'product' | 'page' | 'account';
interface Route { lang: Lang; view: View; productId?: string; pageSlug?: string }

export function parseRoute(pathname: string): Route {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  let lang: Lang = DEFAULT_LANG;
  let rest = parts;
  if (parts.length && (LANGS as string[]).includes(parts[0])) {
    lang = parts[0] as Lang;
    rest = parts.slice(1);
  }
  if (rest[0] === 'product' && rest[1]) return { lang, view: 'product', productId: decode(rest[1]) };
  if (rest[0] === 'page' && rest[1]) return { lang, view: 'page', pageSlug: decode(rest[1]) };
  if (rest[0] === 'account') return { lang, view: 'account' };
  return { lang, view: 'home' };
}
function decode(s: string) { try { return decodeURIComponent(s); } catch { return s; } }
function buildPath(r: Route): string {
  const b = `/${r.lang}`;
  if (r.view === 'product') return `${b}/product/${encodeURIComponent(r.productId || '')}`;
  if (r.view === 'page') return `${b}/page/${encodeURIComponent(r.pageSlug || '')}`;
  if (r.view === 'account') return `${b}/account`;
  return `${b}/`;
}

// ── Localized homepage SEO content (answer-first, compliance-clean) ───────────
interface HomeCopy {
  title: string;
  description: string;
  keywords: string;
  h1: string;
  intro: string;
  sections: { h2: string; p: string }[];
  faq: { q: string; a: string }[];
}

const HOME: Record<Lang, HomeCopy> = {
  zh: {
    title: '通微宝 Therabo | 让补一氧化氮像穿衣一样简单',
    description: '通微宝Therabo是一氧化氮穿戴理疗服装品牌，采用PHOTEX太赫兹生物谱能面料（25–43THz），通过纯物理共振辅助激发人体自身一氧化氮释放、促进微循环。无药物、无激素、可水洗，覆盖护膝、护腰、护颈及健康内衣。北京中科医用材料有限公司研制。',
    keywords: '一氧化氮穿戴理疗服,一氧化氮服装,通微宝,Therabo,PHOTEX,太赫兹面料,远红外功能衣,促进微循环,运动恢复护具,护膝护腰,健康内衣,北京中科医用材料',
    h1: '通微宝 Therabo 一氧化氮穿戴理疗服装',
    intro: '通微宝是一类采用 PHOTEX 太赫兹生物谱能面料的一氧化氮穿戴理疗服装，通过 25–43THz 低能量共振波辅助激发人体自身（内源性）一氧化氮释放，从而帮助促进局部微循环。产品为纺织类穿戴用品，无药物、无激素、可重复水洗。',
    sections: [
      { h2: '一氧化氮与微循环的科学原理', p: '一氧化氮（NO）是人体血管内皮释放的信号分子，参与血管舒张与组织供氧。1998 年诺贝尔生理学或医学奖即授予一氧化氮在心血管信号传导中的作用研究。PHOTEX 面料通过太赫兹共振辅助内皮型一氧化氮合成酶（eNOS）通路，帮助身体自行释放一氧化氮，而非外源补充。' },
      { h2: 'PHOTEX 太赫兹面料技术参数', p: 'PHOTEX 面料发射 25–43THz 的低能量太赫兹波。根据北京晶莱第三方实验室测试，连续穿戴 1 小时后受测部位毛细血管灌流量较穿戴前明显提升（测试数据：穿戴前 NO 浓度约 5.2 µmol/L，穿戴 1 小时后约 14.1 µmol/L）。面料为纯物理作用，不含药物成分。' },
      { h2: '产品系列', p: '通微宝提供三大系列：康复护具系列（护膝、护腰、护颈）、健康内衣系列、以及专用调理系列。各系列均采用同一 PHOTEX 面料，针对不同部位与使用场景设计，适用于运动后恢复、久坐人群与日常穿戴。' }
    ],
    faq: [
      { q: '通微宝一氧化氮理疗服是药品或医疗器械吗？', a: '不是。通微宝属于功能性纺织穿戴用品，通过物理面料技术辅助促进微循环，不含药物、不替代任何药物或医疗器械治疗。' },
      { q: '一氧化氮穿戴服装的原理是什么？', a: 'PHOTEX 面料发射 25–43THz 太赫兹共振波，辅助激发人体自身一氧化氮释放，帮助促进局部血液微循环。' },
      { q: '产品可以水洗吗？', a: '可以。PHOTEX 面料为纯物理结构，可常规水洗并重复使用，技术效果不依赖涂层或药剂。' },
      { q: '适合哪些人群使用？', a: '适合运动后恢复人群、久坐办公人群以及希望日常促进局部微循环的使用者。孕妇、植入电子医疗设备者及特殊健康状况者使用前请咨询医生。' }
    ]
  },
  en: {
    title: 'Therabo | Making Nitric Oxide Supplementation as Simple as Getting Dressed',
    description: 'Therabo makes nitric oxide wearable therapy clothing using PHOTEX terahertz bio-resonance fabric (25–43THz) that helps stimulate your body’s own nitric oxide release and supports microcirculation. Drug-free, hormone-free, washable knee, waist, neck supports and health underwear.',
    keywords: 'nitric oxide wearable therapy clothing, nitric oxide apparel, Therabo, PHOTEX, terahertz fabric, far infrared recovery wear, microcirculation, sports recovery support, knee support, health underwear',
    h1: 'Therabo Nitric Oxide Wearable Therapy Clothing',
    intro: 'Therabo is a line of nitric oxide wearable therapy clothing made with PHOTEX terahertz bio-resonance fabric. The fabric emits low-energy 25–43THz resonance waves that help stimulate your body’s own (endogenous) nitric oxide release to support local microcirculation. The products are textile wearables — drug-free, hormone-free and machine washable.',
    sections: [
      { h2: 'The science of nitric oxide and microcirculation', p: 'Nitric oxide (NO) is a signaling molecule released by the vascular endothelium that supports vessel dilation and tissue oxygenation. The 1998 Nobel Prize in Physiology or Medicine recognized the role of nitric oxide in cardiovascular signaling. PHOTEX fabric uses terahertz resonance to support the endothelial NO synthase (eNOS) pathway so the body releases its own nitric oxide rather than relying on external supplements.' },
      { h2: 'PHOTEX terahertz fabric specifications', p: 'PHOTEX fabric emits low-energy terahertz waves in the 25–43THz band. In third-party testing by the Beijing Jinlai laboratory, capillary perfusion at the tested site rose measurably after one hour of wear (test data: NO concentration ~5.2 µmol/L before wear, ~14.1 µmol/L after one hour). The effect is purely physical and contains no pharmaceutical ingredients.' },
      { h2: 'Product collections', p: 'Therabo offers three collections: rehabilitation supports (knee, waist, neck), health underwear, and advanced specialty wearables. All use the same PHOTEX fabric, designed for different body areas and use cases such as post-exercise recovery, sedentary lifestyles and everyday wear.' }
    ],
    faq: [
      { q: 'Is Therabo nitric oxide clothing a drug or a medical device?', a: 'No. Therabo is functional textile apparel that uses physical fabric technology to support microcirculation. It contains no drugs and does not replace any medication or medical treatment.' },
      { q: 'How does nitric oxide wearable clothing work?', a: 'PHOTEX fabric emits 25–43THz terahertz resonance waves that help stimulate your body’s own nitric oxide release to support local blood microcirculation.' },
      { q: 'Is the product washable?', a: 'Yes. PHOTEX fabric is a purely physical structure that can be machine washed and reused; the effect does not depend on coatings or chemicals.' },
      { q: 'Who is it suitable for?', a: 'It suits people in post-exercise recovery, those with sedentary routines, and anyone wanting to support everyday local microcirculation. Pregnant users, people with implanted electronic medical devices or specific health conditions should consult a doctor first.' }
    ]
  },
  'zh-tw': {
    title: '通微寶 Therabo | 讓補一氧化氮像穿衣一樣簡單',
    description: '通微寶Therabo是一氧化氮穿戴理療服裝品牌，採用PHOTEX太赫茲生物譜能面料（25–43THz），透過純物理共振輔助激發人體自身一氧化氮釋放、促進微循環。無藥物、無激素、可水洗，涵蓋護膝、護腰、護頸及健康內衣。',
    keywords: '一氧化氮穿戴理療服,通微寶,Therabo,PHOTEX,太赫茲面料,遠紅外功能衣,促進微循環,運動恢復護具,護膝護腰,健康內衣',
    h1: '通微寶 Therabo 一氧化氮穿戴理療服裝',
    intro: '通微寶是一類採用 PHOTEX 太赫茲生物譜能面料的一氧化氮穿戴理療服裝，透過 25–43THz 低能量共振波輔助激發人體自身（內源性）一氧化氮釋放，幫助促進局部微循環。產品為紡織類穿戴用品，無藥物、無激素、可重複水洗。',
    sections: [
      { h2: '一氧化氮與微循環的科學原理', p: '一氧化氮（NO）是人體血管內皮釋放的信號分子，參與血管舒張與組織供氧。1998 年諾貝爾生理學或醫學獎即授予一氧化氮在心血管信號傳導中的作用研究。PHOTEX 面料透過太赫茲共振輔助內皮型一氧化氮合成酶（eNOS）通路，幫助身體自行釋放一氧化氮。' },
      { h2: 'PHOTEX 太赫茲面料技術參數', p: 'PHOTEX 面料發射 25–43THz 的低能量太赫茲波。根據北京晶萊第三方實驗室測試，連續穿戴 1 小時後受測部位毛細血管灌流量較穿戴前明顯提升（穿戴前 NO 濃度約 5.2 µmol/L，穿戴 1 小時後約 14.1 µmol/L）。' },
      { h2: '產品系列', p: '通微寶提供三大系列：康復護具系列（護膝、護腰、護頸）、健康內衣系列、以及專用調理系列，適用於運動後恢復、久坐人群與日常穿戴。' }
    ],
    faq: [
      { q: '通微寶一氧化氮理療服是藥品或醫療器械嗎？', a: '不是。通微寶屬於功能性紡織穿戴用品，透過物理面料技術輔助促進微循環，不含藥物、不替代任何藥物或醫療器械治療。' },
      { q: '一氧化氮穿戴服裝的原理是什麼？', a: 'PHOTEX 面料發射 25–43THz 太赫茲共振波，輔助激發人體自身一氧化氮釋放，幫助促進局部血液微循環。' },
      { q: '產品可以水洗嗎？', a: '可以。PHOTEX 面料為純物理結構，可常規水洗並重複使用。' }
    ]
  },
  ja: {
    title: '一酸化窒素の補給を着るだけで簡単に | Therabo 通微宝',
    description: 'Theraboは PHOTEXテラヘルツ素材（25–43THz）を用いた一酸化窒素ウェアラブル機能性ウェアです。物理的な共鳴で体内の一酸化窒素の放出を助け、微小循環をサポート。薬剤・ホルモン不使用、洗濯可能。',
    keywords: '一酸化窒素, ウェアラブル, PHOTEX, テラヘルツ素材, 微小循環, 機能性ウェア, Therabo, 通微宝',
    h1: 'Therabo 一酸化窒素ウェアラブル機能性ウェア',
    intro: 'Theraboは PHOTEXテラヘルツ素材を用いた機能性ウェアです。25–43THzの低エネルギー共鳴波で体内（内因性）の一酸化窒素の放出を助け、局所の微小循環をサポートします。繊維製品であり、薬剤・ホルモンは含みません。',
    sections: [
      { h2: '一酸化窒素と微小循環', p: '一酸化窒素（NO）は血管内皮から放出されるシグナル分子で、血管拡張と組織への酸素供給に関与します。1998年のノーベル生理学・医学賞は一酸化窒素の心血管シグナル研究に授与されました。' },
      { h2: 'PHOTEXテラヘルツ素材の仕様', p: 'PHOTEX素材は 25–43THz の低エネルギーテラヘルツ波を放射します。第三者試験では、1時間の着用後に試験部位の毛細血管灌流の上昇が確認されています。' }
    ],
    faq: [
      { q: 'Theraboは医薬品や医療機器ですか？', a: 'いいえ。Theraboは機能性繊維ウェアであり、薬剤を含まず、医薬品や治療の代替ではありません。' },
      { q: '仕組みは？', a: 'PHOTEX素材が 25–43THz のテラヘルツ共鳴波を放射し、体内の一酸化窒素の放出を助けて局所の微小循環をサポートします。' }
    ]
  },
  ko: {
    title: 'Therabo 통웨이바오 | 산화질소 보충을 옷 입듯 간단하게',
    description: 'Therabo는 PHOTEX 테라헤르츠 원단(25–43THz)을 사용한 산화질소 웨어러블 기능성 의류입니다. 물리적 공명으로 체내 산화질소 방출을 도와 미세순환을 지원합니다. 무약물·무호르몬·세탁 가능.',
    keywords: '산화질소, 웨어러블, PHOTEX, 테라헤르츠 원단, 미세순환, 기능성 의류, Therabo',
    h1: 'Therabo 산화질소 웨어러블 기능성 의류',
    intro: 'Therabo는 PHOTEX 테라헤르츠 원단을 사용한 기능성 의류입니다. 25–43THz 저에너지 공명파로 체내(내인성) 산화질소 방출을 도와 국소 미세순환을 지원합니다. 섬유 제품이며 약물·호르몬을 포함하지 않습니다.',
    sections: [
      { h2: '산화질소와 미세순환', p: '산화질소(NO)는 혈관 내피에서 방출되는 신호 분자로 혈관 확장과 조직 산소 공급에 관여합니다. 1998년 노벨 생리의학상은 산화질소의 심혈관 신호 연구에 수여되었습니다.' },
      { h2: 'PHOTEX 테라헤르츠 원단 사양', p: 'PHOTEX 원단은 25–43THz 저에너지 테라헤르츠파를 방출합니다. 제3자 시험에서 1시간 착용 후 시험 부위의 모세혈관 관류 상승이 확인되었습니다.' }
    ],
    faq: [
      { q: 'Therabo는 의약품이나 의료기기인가요?', a: '아닙니다. Therabo는 기능성 섬유 의류이며 약물을 포함하지 않고 의약품이나 치료를 대체하지 않습니다.' },
      { q: '작동 원리는?', a: 'PHOTEX 원단이 25–43THz 테라헤르츠 공명파를 방출하여 체내 산화질소 방출을 도와 국소 미세순환을 지원합니다.' }
    ]
  }
};

// ── Head + body builders ─────────────────────────────────────────────────────
interface Built { htmlLang: string; title: string; description: string; keywords: string; head: string; body: string; }

function altLinks(route: Route): string {
  const base = baseUrl();
  const links = LANGS.map(
    (l) => `<link rel="alternate" hreflang="${HREFLANG[l]}" href="${base}${buildPath({ ...route, lang: l })}" />`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${base}${buildPath({ ...route, lang: DEFAULT_LANG })}" />`);
  return links.join('\n    ');
}

function ogBlock(route: Route, title: string, description: string, image: string): string {
  const base = baseUrl();
  const url = base + buildPath(route);
  const alt = LANGS.filter((l) => l !== route.lang)
    .map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`).join('\n    ');
  return [
    `<meta property="og:type" content="${route.view === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[route.lang]}" />`,
    alt,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`
  ].join('\n    ');
}

function jsonLd(obj: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
}

function buildHome(route: Route): Built {
  const c = HOME[route.lang] || HOME.zh;
  const base = baseUrl();
  const image = `${base}/photex-fabric-hero.jpg`;
  const faqLd = jsonLd({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({
      '@type': 'Question', name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  });
  const head = [
    altLinks(route),
    ogBlock(route, c.title, c.description, image),
    faqLd
  ].join('\n    ');
  const body = [
    `<h1>${esc(c.h1)}</h1>`,
    `<p>${esc(c.intro)}</p>`,
    ...c.sections.map((s) => `<section><h2>${esc(s.h2)}</h2><p>${esc(s.p)}</p></section>`),
    `<section><h2>FAQ</h2>${c.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</section>`
  ].join('\n');
  return { htmlLang: HTML_LANG[route.lang], title: c.title, description: c.description, keywords: c.keywords, head, body };
}

function getProduct(id: string): ProductDTO | null {
  try {
    const row = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id) as ProductRow | undefined;
    return row ? rowToProduct(row) : null;
  } catch {
    return null;
  }
}

function buildProduct(route: Route, p: ProductDTO): Built {
  const lang = route.lang;
  const base = baseUrl();
  const url = base + buildPath(route);
  const name = pickI18n(p.name, lang);
  const tagline = pickI18n(p.tagline, lang);
  const description = clip(pickI18n(p.description, lang) || tagline, 300);
  const details = p.details[lang] || p.details.zh || [];
  const image = p.images?.[0]
    ? (p.images[0].startsWith('http') ? p.images[0] : base + p.images[0])
    : `${base}/photex-fabric-hero.jpg`;
  const isZh = lang === 'zh' || lang === 'zh-tw';
  const title = p.seoTitle || (isZh
    ? `${name}_${tagline || '一氧化氮穿戴理疗'}_${SITE_NAME}`
    : `${name} - Nitric Oxide Recovery Apparel | Therabo`);
  const keywords = isZh
    ? `${name},一氧化氮穿戴理疗服,通微宝,PHOTEX,太赫兹面料,促进微循环`
    : `${name}, nitric oxide wearable, Therabo, PHOTEX, terahertz fabric, microcirculation`;

  const productLd = jsonLd({
    '@context': 'https://schema.org', '@type': 'Product',
    name, description, image, url, sku: p.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: 'Nitric Oxide Therapy',
    offers: {
      '@type': 'Offer', priceCurrency: 'CNY', price: p.priceCNY, url,
      availability: p.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
    }
  });
  const crumbLd = jsonLd({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${base}/${lang}/` },
      { '@type': 'ListItem', position: 2, name, item: url }
    ]
  });
  const head = [altLinks(route), ogBlock(route, title, description, image), productLd, crumbLd].join('\n    ');
  const specs = details.length
    ? `<section><h3>${isZh ? '产品规格与说明' : 'Specifications'}</h3><ul>${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></section>`
    : '';
  const body = [
    `<h1>${esc(name)}</h1>`,
    tagline ? `<p>${esc(tagline)}</p>` : '',
    `<h2>${isZh ? '产品介绍' : 'Overview'}</h2>`,
    `<p>${esc(pickI18n(p.description, lang))}</p>`,
    specs
  ].filter(Boolean).join('\n');
  return { htmlLang: HTML_LANG[lang], title, description, keywords, head, body };
}

function getPage(slug: string): { title: I18n; bodyHtml: I18n } | null {
  try {
    const row = db.prepare('SELECT title, body_html FROM pages WHERE slug = ?').get(slug) as
      { title: string; body_html: string } | undefined;
    if (!row) return null;
    const safe = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };
    return { title: safe(row.title), bodyHtml: safe(row.body_html) };
  } catch {
    return null;
  }
}

function buildPage(route: Route, page: { title: I18n; bodyHtml: I18n }): Built {
  const lang = route.lang;
  const title = `${pickI18n(page.title, lang)} | ${SITE_NAME}`;
  const html = pickI18n(page.bodyHtml, lang);
  const description = clip(stripHtml(html), 200);
  const head = [altLinks(route), ogBlock(route, title, description, `${baseUrl()}/photex-fabric-hero.jpg`)].join('\n    ');
  const body = `<h1>${esc(pickI18n(page.title, lang))}</h1>\n${html}`;
  return { htmlLang: HTML_LANG[lang], title, description, keywords: '', head, body };
}

function build(route: Route): Built {
  if (route.view === 'product' && route.productId) {
    const p = getProduct(route.productId);
    if (p) return buildProduct(route, p);
  }
  if (route.view === 'page' && route.pageSlug) {
    const pg = getPage(route.pageSlug);
    if (pg) return buildPage(route, pg);
  }
  // account → noindex home shell
  return buildHome(route);
}

/**
 * Rewrite the built index.html for the given request path. Replaces the static
 * head defaults with route-specific tags and injects no-JS content into #root.
 */
export function renderHtml(template: string, pathname: string): string {
  const route = parseRoute(pathname);
  const b = build(route);
  const base = baseUrl();
  const canonical = base + buildPath(route);
  const robots = route.view === 'account'
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  let html = template;
  // <html lang>
  html = html.replace(/<html[^>]*>/, `<html lang="${b.htmlLang}">`);
  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(b.title)}</title>`);
  // description
  html = html.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(b.description)}" />`);
  // keywords (replace if present, else inject)
  if (/<meta\s+name="keywords"[^>]*>/.test(html)) {
    html = html.replace(/<meta\s+name="keywords"[^>]*>/, b.keywords ? `<meta name="keywords" content="${esc(b.keywords)}" />` : '');
  } else if (b.keywords) {
    html = html.replace('</head>', `  <meta name="keywords" content="${esc(b.keywords)}" />\n  </head>`);
  }
  // robots
  if (/<meta\s+name="robots"[^>]*>/.test(html)) {
    html = html.replace(/<meta\s+name="robots"[^>]*>/, `<meta name="robots" content="${robots}" />`);
  }
  // canonical
  html = html.replace(/<link\s+rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  // strip the static hreflang + OG/twitter so we can inject fresh per-route ones
  html = html.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="og:[^"]*"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+name="twitter:[^"]*"[^>]*>/g, '');
  // inject route head before </head>
  html = html.replace('</head>', `    ${b.head}\n  </head>`);
  // No-JS content fallback: <noscript> is rendered by crawlers that don't run
  // JS (Baidu, many RAG/AI scrapers) and ignored by JS browsers + Googlebot,
  // so it surfaces real content without any hidden-text / cloaking risk.
  html = html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root"><noscript><main id="seo-ssr">${b.body}</main></noscript></div>`
  );
  return html;
}
