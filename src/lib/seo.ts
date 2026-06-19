/**
 * Client-side SEO helper.
 *
 * The static <head> in index.html covers the homepage (the URL crawlers fetch
 * first). This module keeps <title>, meta description, canonical and the social
 * cards in sync as the SPA navigates between the homepage, product details and
 * content pages — Google renders JS, so per-view meta improves how individual
 * products surface in search and link previews.
 */
import { Language, Product } from '../types';
import { Route, buildPath, SUPPORTED_LANGS, HREFLANG, DEFAULT_LANG } from './router';

export const SITE_NAME = '通微宝 Therabo';
export const BASE_URL = 'https://therabo.com';
const OG_IMAGE = `${BASE_URL}/photex-fabric-hero.jpg`;

type Localized = Record<Language, string>;

const DEFAULT_TITLE: Localized = {
  zh: '通微宝 Therabo | 一氧化氮可穿戴科技 · PHOTEX 太赫兹面料',
  'zh-tw': '通微寶 Therabo | 一氧化氮可穿戴科技 · PHOTEX 太赫茲面料',
  en: 'Therabo | Nitric Oxide Wearable Technology · PHOTEX Terahertz Fabric',
  ja: 'Therabo 通微宝 | 一酸化窒素ウェアラブル · PHOTEXテラヘルツ素材',
  ko: 'Therabo 통웨이바오 | 산화질소 웨어러블 · PHOTEX 테라헤르츠 원단'
};

const DEFAULT_DESC: Localized = {
  zh: '通微宝 Therabo 应用 PHOTEX 太赫兹生物谱能面料（25–43THz），纯物理共振激活人体自身「内源性一氧化氮」，促进微循环与血管健康。无药物、无激素、可水洗的可穿戴健康系列。',
  'zh-tw': '通微寶 Therabo 應用 PHOTEX 太赫茲生物譜能面料（25–43THz），純物理共振激活人體自身「內源性一氧化氮」，促進微循環與血管健康。無藥物、無激素、可水洗的可穿戴健康系列。',
  en: 'Therabo applies PHOTEX terahertz bio-resonance fabric (25–43THz) to stimulate your body’s own endogenous nitric oxide and restore microcirculation — drug-free, hormone-free, washable wearable health products.',
  ja: 'Theraboは PHOTEXテラヘルツ素材（25〜43THz）で体内の内因性一酸化窒素を引き出し、微小循環をサポート。薬剤・ホルモン不使用、洗えるウェアラブル健康製品。',
  ko: 'Therabo는 PHOTEX 테라헤르츠 원단(25–43THz)으로 체내 내인성 산화질소를 활성화하여 미세순환을 돕습니다. 무약물·무호르몬·세탁 가능한 웨어러블 건강 제품.'
};

function langOf(lang: Language): Language {
  return DEFAULT_TITLE[lang] ? lang : 'zh';
}

const HTML_LANG: Localized = {
  zh: 'zh-CN',
  'zh-tw': 'zh-TW',
  en: 'en',
  ja: 'ja',
  ko: 'ko'
};

function setHtmlLang(lang: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = HTML_LANG[langOf(lang)];
}

/** Pick a localized string from a product field, falling back to zh then en. */
function pick(field: Partial<Record<Language, string>> | undefined, lang: Language): string {
  if (!field) return '';
  return field[lang] || field.zh || field.en || Object.values(field)[0] || '';
}

function upsertMeta(key: string, attr: 'name' | 'property', value: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function upsertCanonical(href: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Rewrite the hreflang alternates to point at the current page in every locale. */
function applyAlternates(route: Route) {
  if (typeof document === 'undefined') return;
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove());
  const add = (hreflang: string, href: string) => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  };
  for (const lang of SUPPORTED_LANGS) {
    add(HREFLANG[lang], BASE_URL + buildPath({ ...route, lang }));
  }
  add('x-default', BASE_URL + buildPath({ ...route, lang: DEFAULT_LANG }));
}

interface MetaInput {
  title: string;
  description: string;
  url: string;
  image?: string;
  robots?: string;
}

function applyMeta({ title, description, url, image = OG_IMAGE, robots }: MetaInput) {
  if (typeof document === 'undefined') return;
  document.title = title;
  upsertMeta('description', 'name', description);
  upsertMeta('robots', 'name', robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  upsertCanonical(url);
  upsertMeta('og:title', 'property', title);
  upsertMeta('og:description', 'property', description);
  upsertMeta('og:url', 'property', url);
  upsertMeta('og:image', 'property', image);
  upsertMeta('twitter:title', 'name', title);
  upsertMeta('twitter:description', 'name', description);
  upsertMeta('twitter:image', 'name', image);
}

/** Homepage / catalog / CMS page default meta, localized to the active language. */
export function applyDefaultMeta(route: Route) {
  const l = langOf(route.lang);
  setHtmlLang(l);
  applyAlternates(route);
  applyMeta({
    title: DEFAULT_TITLE[l],
    description: DEFAULT_DESC[l],
    url: BASE_URL + buildPath(route)
  });
}

/** Rich meta for a single product view, with Product structured data. */
export function applyProductMeta(product: Product, route: Route) {
  const l = langOf(route.lang);
  setHtmlLang(l);
  applyAlternates(route);
  const name = pick(product.name, l);
  const tagline = pick(product.tagline, l);
  const desc =
    product.seoDescription ||
    pick(product.description, l) ||
    tagline ||
    DEFAULT_DESC[l];
  const title = `${name}${tagline ? ' · ' + tagline : ''} | ${SITE_NAME}`;
  const url = BASE_URL + buildPath(route);
  const image = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : BASE_URL + product.images[0])
    : OG_IMAGE;
  applyMeta({
    title: product.seoTitle || title,
    description: desc.length > 300 ? desc.slice(0, 297) + '…' : desc,
    url,
    image
  });
  upsertProductJsonLd(product, name, desc, image, url);
}

/** Account/checkout style views should not be indexed. */
export function applyNoindexMeta(route: Route) {
  const l = langOf(route.lang);
  setHtmlLang(l);
  applyAlternates(route);
  applyMeta({
    title: DEFAULT_TITLE[l],
    description: DEFAULT_DESC[l],
    url: BASE_URL + buildPath(route),
    robots: 'noindex, follow'
  });
}

const PRODUCT_JSONLD_ID = 'therabo-product-jsonld';

function upsertProductJsonLd(
  product: Product,
  name: string,
  description: string,
  image: string,
  url: string
) {
  if (typeof document === 'undefined') return;
  removeProductJsonLd();
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    brand: { '@type': 'Brand', name: SITE_NAME },
    sku: product.id
  };
  if (typeof product.priceCNY === 'number') {
    data.offers = {
      '@type': 'Offer',
      priceCurrency: 'CNY',
      price: product.priceCNY,
      availability:
        product.stock === 0
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      url
    };
  }
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = PRODUCT_JSONLD_ID;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function removeProductJsonLd() {
  if (typeof document === 'undefined') return;
  document.getElementById(PRODUCT_JSONLD_ID)?.remove();
}
