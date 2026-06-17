/**
 * Path-based router for the Therabo storefront.
 *
 * Replaces the old hash routing (#product/:id) with real, crawlable URLs that
 * carry the language as a subdirectory so each locale is a distinct indexable
 * page — the prerequisite for international SEO (Google EU/US + Baidu) and for
 * the server-side meta/JSON-LD injection in server/src/routes/seo-render.ts.
 *
 *   /zh/                     home (Simplified Chinese — default)
 *   /en/product/:id          product detail (English)
 *   /zh-tw/page/:slug        CMS page (Traditional Chinese)
 *   /ja/account              account (noindex)
 *
 * The admin console stays on the #admin hash and is untouched by this router.
 */
import { Language } from '../types';

export const SUPPORTED_LANGS: Language[] = ['zh', 'zh-tw', 'en', 'ja', 'ko'];
export const DEFAULT_LANG: Language = 'zh';

/** BCP-47 codes used in <html lang> and hreflang. */
export const HREFLANG: Record<Language, string> = {
  zh: 'zh-Hans',
  'zh-tw': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko'
};

export type RouteView = 'home' | 'product' | 'page' | 'account';

export interface Route {
  lang: Language;
  view: RouteView;
  productId?: string;
  pageSlug?: string;
}

function isLang(seg: string): seg is Language {
  return (SUPPORTED_LANGS as string[]).includes(seg);
}

/** Parse a pathname into a Route, defaulting the language when absent/invalid. */
export function parseRoute(pathname: string): Route {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  let lang: Language = DEFAULT_LANG;
  let rest = parts;
  if (parts.length && isLang(parts[0])) {
    lang = parts[0];
    rest = parts.slice(1);
  }
  if (rest[0] === 'product' && rest[1]) {
    return { lang, view: 'product', productId: safeDecode(rest[1]) };
  }
  if (rest[0] === 'page' && rest[1]) {
    return { lang, view: 'page', pageSlug: safeDecode(rest[1]) };
  }
  if (rest[0] === 'account') {
    return { lang, view: 'account' };
  }
  return { lang, view: 'home' };
}

/** Build a canonical pathname (always with a language prefix) for a Route. */
export function buildPath(route: Route): string {
  const base = `/${route.lang}`;
  switch (route.view) {
    case 'product':
      return `${base}/product/${encodeURIComponent(route.productId || '')}`;
    case 'page':
      return `${base}/page/${encodeURIComponent(route.pageSlug || '')}`;
    case 'account':
      return `${base}/account`;
    default:
      return `${base}/`;
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
