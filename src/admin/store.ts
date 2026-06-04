/**
 * Front-end API client + in-memory cache.
 *
 * Previously this file persisted everything to localStorage. It now talks to
 * the Therabo backend over /api/*. The function signatures are kept compatible
 * with the existing components (sync getters return cached values; mutators are
 * now async and trigger a refresh + event notification).
 *
 * Cache contents:
 *   - public:  products, site content, current customer session
 *   - admin:   orders, customer accounts, admin user list — only populated
 *              after the admin signs in (or when an admin page asks).
 *
 * Components stay reactive via the same `subscribe()` /
 * `subscribeCustomerSession()` callbacks they used before.
 */

import { Language, Product, TranslationDict } from '../types';
import { translations } from '../data/translations';
import {
  AdminUserAccount, CustomerAccount, CustomerAddress, CustomerRecord,
  Order, OrderLineItem, OrderStatus, SiteContent
} from './types';

// API base — same origin in production, override via VITE_API_BASE in dev when
// the Express server is on another port.
const API_BASE: string = (import.meta.env?.VITE_API_BASE as string) || '';

const STORE_EVENT = 'therabo:store-changed';
const CUST_EVENT  = 'therabo:customer-session';

// ──────────── Commerce visibility (admin-controlled storefront toggles) ────────────
export interface CommerceConfig {
  shoppingEnabled: boolean;   // false → hide cart, "add to cart", checkout entirely
  showPrices: boolean;        // false → hide all price displays on the storefront
}

export const DEFAULT_COMMERCE: CommerceConfig = {
  shoppingEnabled: true,
  showPrices: true
};

// ──────────── Cache ────────────
interface Cache {
  products: Product[];
  orders: Order[];
  customers: CustomerAccount[];     // admin-side full list of registered accounts
  users: AdminUserAccount[];
  content: SiteContent;
  commerce: CommerceConfig;
  currentAdmin: { username: string; role: 'admin' | 'editor' } | null;
  currentCustomer: CustomerAccount | null;
  initialized: boolean;
}

const defaultContent: SiteContent = {
  hero: {
    badge:      { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
    headline:   { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
    subheading: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }
  },
  about: {
    title: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
    body:  { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }
  },
  contactEmail: 'liufei@therabo.top',
  contactPhone: '4009010913',
  translations: {}
};

function applyTranslationOverrides(content: SiteContent): void {
  if (!content.translations) return;
  for (const lang of Object.keys(content.translations) as Language[]) {
    Object.assign(translations[lang], content.translations[lang] as Partial<TranslationDict>);
  }
}

function normalizeProductLanguages(product: Product): Product {
  for (const lang of ['ja', 'ko']) {
    product.name[lang] ||= product.name.zh || product.name.en || '';
    product.tagline[lang] ||= product.tagline.zh || product.tagline.en || '';
    product.description[lang] ||= product.description.zh || product.description.en || '';
    product.recommendedUse[lang] ||= product.recommendedUse.zh || product.recommendedUse.en || '';
    product.details[lang] ||= product.details.zh || product.details.en || [];
  }
  return product;
}

const cache: Cache = {
  products: [],
  orders: [],
  customers: [],
  users: [],
  content: defaultContent,
  commerce: { ...DEFAULT_COMMERCE },
  currentAdmin: null,
  currentCustomer: null,
  initialized: false
};

function notifyStore(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORE_EVENT));
}
function notifyCustomer(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CUST_EVENT));
}

// ──────────── Fetch helper ────────────
async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: init.body && !(init.body instanceof FormData)
      ? { 'Content-Type': 'application/json', ...(init.headers || {}) }
      : (init.headers || {}),
    ...init
  });
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && (data as { error?: string }).error) || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

// ──────────── Init (call once at app boot) ────────────
export async function initStore(): Promise<void> {
  if (cache.initialized) return;
  cache.initialized = true;
  try {
    const [products, content, settings] = await Promise.all([
      api<Product[]>('/api/products'),
      api<SiteContent>('/api/content'),
      api<Record<string, unknown>>('/api/settings').catch(() => ({}))
    ]);
    cache.products = products.map(normalizeProductLanguages);
    cache.content = content && content.hero ? content : defaultContent;
    applyTranslationOverrides(cache.content);
    cache.commerce = parseCommerce(settings);
  } catch (err) {
    console.warn('[therabo] initial fetch failed', err);
  }
  // Resume sessions if cookies are still valid
  try { cache.currentCustomer = await api<CustomerAccount>('/api/customers/me'); } catch { /* not logged in */ }
  try { cache.currentAdmin    = await api<Cache['currentAdmin']>('/api/admin/me'); } catch { /* not logged in */ }
  notifyStore();
  notifyCustomer();
}

// ──────────── Subscribe ────────────
export function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(STORE_EVENT, listener);
  return () => window.removeEventListener(STORE_EVENT, listener);
}

export function subscribeCustomerSession(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(CUST_EVENT, listener);
  window.addEventListener(STORE_EVENT, listener);
  return () => {
    window.removeEventListener(CUST_EVENT, listener);
    window.removeEventListener(STORE_EVENT, listener);
  };
}

// ──────────── Commerce config ────────────
function parseCommerce(settings: Record<string, unknown> | null | undefined): CommerceConfig {
  const raw = (settings && (settings as Record<string, unknown>).commerce) as Partial<CommerceConfig> | undefined;
  return {
    shoppingEnabled: raw?.shoppingEnabled !== undefined ? !!raw.shoppingEnabled : DEFAULT_COMMERCE.shoppingEnabled,
    showPrices:      raw?.showPrices      !== undefined ? !!raw.showPrices      : DEFAULT_COMMERCE.showPrices
  };
}

export function getCommerceConfig(): CommerceConfig {
  return cache.commerce;
}

export async function refreshCommerceConfig(): Promise<CommerceConfig> {
  try {
    const settings = await api<Record<string, unknown>>('/api/settings');
    cache.commerce = parseCommerce(settings);
  } catch (err) { console.warn('[therabo] refreshCommerceConfig failed', err); }
  notifyStore();
  return cache.commerce;
}

// ──────────── Products ────────────
export function listProducts(): Product[] {
  return cache.products;
}

export async function refreshProducts(): Promise<Product[]> {
  // Admin view fetches *all* products (incl. inactive) — admin pages call this.
  // The public list comes from the standard endpoint.
  try {
    const products = await api<Product[]>(cache.currentAdmin ? '/api/products/admin/all' : '/api/products');
    cache.products = cache.currentAdmin ? products : products.map(normalizeProductLanguages);
  } catch (err) { console.warn('[therabo] refreshProducts failed', err); }
  notifyStore();
  return cache.products;
}

export async function upsertProduct(p: Product): Promise<void> {
  const exists = cache.products.some((x) => x.id === p.id);
  if (exists) {
    await api(`/api/products/${encodeURIComponent(p.id)}`, { method: 'PUT', body: JSON.stringify(p) });
  } else {
    await api('/api/products', { method: 'POST', body: JSON.stringify(p) });
  }
  await refreshProducts();
}

export async function deleteProduct(id: string): Promise<void> {
  await api(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await refreshProducts();
}

// ──────────── Orders ────────────
export function listOrders(): Order[] {
  return cache.orders;
}

export async function refreshOrders(): Promise<Order[]> {
  try { cache.orders = await api<Order[]>('/api/orders/admin'); }
  catch (err) { console.warn('[therabo] refreshOrders failed', err); }
  notifyStore();
  return cache.orders;
}

export async function createOrder(input: {
  currency: 'USD' | 'CNY';
  items: OrderLineItem[];
  customer: Order['customer'];
  customerId?: string;
  note?: string;
}): Promise<Order> {
  return api<Order>('/api/orders', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await api(`/api/orders/admin/${encodeURIComponent(id)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status })
  });
  await refreshOrders();
}

export async function deleteOrder(id: string): Promise<void> {
  await api(`/api/orders/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await refreshOrders();
}

export function exportOrdersAsCsv(orders: Order[]): string {
  const head = [
    'Order ID', 'Created At', 'Status', 'Currency', 'Subtotal',
    'Customer Name', 'Customer Email', 'Customer Phone', 'Country', 'Address',
    'Items'
  ];
  const rows = orders.map((o) => [
    o.id, o.createdAt, o.status, o.currency, o.subtotal.toString(),
    o.customer.name, o.customer.email, o.customer.phone || '',
    o.customer.country, o.customer.address || '',
    o.items.map((it) => `${it.productName} x${it.quantity} (${it.selectedSize}/${it.selectedColorName}) @${it.unitPrice}`).join(' | ')
  ]);
  return [head, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ──────────── Customers (admin aggregated view) ────────────
export function listCustomers(): CustomerRecord[] {
  const map = new Map<string, CustomerRecord>();
  for (const c of cache.customers) {
    const key = c.email.toLowerCase().trim();
    map.set(key, {
      email: c.email, name: c.name, country: c.country || '—',
      orders: 0, totalSpentCNY: 0, totalSpentUSD: 0,
      lastOrderAt: c.lastLoginAt || c.createdAt,
      registered: true, customerId: c.id, status: c.status, createdAt: c.createdAt
    });
  }
  for (const o of cache.orders) {
    const key = (o.customer.email || `${o.customer.name}@unknown`).toLowerCase().trim();
    const cur = map.get(key) || {
      email: o.customer.email, name: o.customer.name, country: o.customer.country,
      orders: 0, totalSpentCNY: 0, totalSpentUSD: 0, lastOrderAt: o.createdAt, registered: false
    };
    cur.orders += 1;
    if (o.currency === 'CNY') cur.totalSpentCNY += o.subtotal;
    else cur.totalSpentUSD += o.subtotal;
    if (new Date(o.createdAt) > new Date(cur.lastOrderAt)) cur.lastOrderAt = o.createdAt;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.orders - a.orders);
}

// ──────────── Customer accounts (admin) ────────────
export function listCustomerAccounts(): CustomerAccount[] {
  return cache.customers;
}

export async function refreshCustomerAccounts(): Promise<CustomerAccount[]> {
  try { cache.customers = await api<CustomerAccount[]>('/api/customers/admin/list'); }
  catch (err) { console.warn('[therabo] refreshCustomerAccounts failed', err); }
  notifyStore();
  return cache.customers;
}

export async function setCustomerStatus(customerId: string, status: 'active' | 'disabled'): Promise<void> {
  await api(`/api/customers/admin/${encodeURIComponent(customerId)}/status`, {
    method: 'PATCH', body: JSON.stringify({ status })
  });
  await refreshCustomerAccounts();
}

export async function adminResetCustomerPassword(customerId: string, newPassword: string): Promise<void> {
  await api(`/api/customers/admin/${encodeURIComponent(customerId)}/reset-password`, {
    method: 'POST', body: JSON.stringify({ newPassword })
  });
}

export async function deleteCustomerAccount(customerId: string): Promise<void> {
  await api(`/api/customers/admin/${encodeURIComponent(customerId)}`, { method: 'DELETE' });
  await refreshCustomerAccounts();
}

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  // Admin context — filter the already-cached orders by customer link or email.
  const acc = cache.customers.find((c) => c.id === customerId);
  const email = acc ? acc.email.toLowerCase() : '';
  return cache.orders.filter((o) =>
    o.customerId === customerId ||
    (email && (o.customer.email || '').toLowerCase() === email)
  );
}

// ──────────── Customer self-service ────────────
export function currentCustomer(): CustomerAccount | null {
  return cache.currentCustomer;
}

export async function registerCustomer(input: {
  name: string; email: string; password: string; phone?: string; country?: string;
}): Promise<CustomerAccount> {
  const acc = await api<CustomerAccount>('/api/customers/register', {
    method: 'POST', body: JSON.stringify(input)
  });
  cache.currentCustomer = acc;
  notifyCustomer();
  return acc;
}

export async function customerLogin(email: string, password: string): Promise<CustomerAccount> {
  const acc = await api<CustomerAccount>('/api/customers/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  });
  cache.currentCustomer = acc;
  notifyCustomer();
  return acc;
}

export async function customerLogout(): Promise<void> {
  await api('/api/customers/logout', { method: 'POST' });
  cache.currentCustomer = null;
  notifyCustomer();
}

export async function updateCustomerProfile(
  _customerId: string,
  patch: Partial<Pick<CustomerAccount, 'name' | 'phone' | 'country'>>
): Promise<CustomerAccount> {
  const acc = await api<CustomerAccount>('/api/customers/me', {
    method: 'PUT', body: JSON.stringify(patch)
  });
  cache.currentCustomer = acc;
  notifyCustomer();
  return acc;
}

export async function changeCustomerPassword(
  _customerId: string, oldPassword: string, newPassword: string
): Promise<void> {
  await api('/api/customers/me/password', {
    method: 'POST', body: JSON.stringify({ oldPassword, newPassword })
  });
}

async function refreshCurrentCustomerWithAddresses(): Promise<void> {
  try {
    const acc = await api<CustomerAccount>('/api/customers/me');
    const addresses = await api<CustomerAddress[]>('/api/customers/me/addresses');
    cache.currentCustomer = { ...acc, addresses };
    notifyCustomer();
  } catch { /* not logged in */ }
}

export async function addCustomerAddress(
  _customerId: string, input: Omit<CustomerAddress, 'id'>
): Promise<CustomerAddress> {
  const r = await api<{ id: string }>('/api/customers/me/addresses', {
    method: 'POST', body: JSON.stringify(input)
  });
  await refreshCurrentCustomerWithAddresses();
  return { ...input, id: r.id };
}

export async function updateCustomerAddress(
  _customerId: string, addressId: string, patch: Partial<Omit<CustomerAddress, 'id'>>
): Promise<void> {
  await api(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, {
    method: 'PUT', body: JSON.stringify(patch)
  });
  await refreshCurrentCustomerWithAddresses();
}

export async function deleteCustomerAddress(_customerId: string, addressId: string): Promise<void> {
  await api(`/api/customers/me/addresses/${encodeURIComponent(addressId)}`, { method: 'DELETE' });
  await refreshCurrentCustomerWithAddresses();
}

export async function fetchCustomerOrders(): Promise<Order[]> {
  return api<Order[]>('/api/customers/me/orders');
}

// ──────────── Admin users ────────────
export function listUsers(): AdminUserAccount[] {
  return cache.users;
}

export async function refreshUsers(): Promise<AdminUserAccount[]> {
  try { cache.users = await api<AdminUserAccount[]>('/api/admin/users'); }
  catch (err) { console.warn('[therabo] refreshUsers failed', err); }
  notifyStore();
  return cache.users;
}

export async function addUser(u: { username: string; password: string; role: 'admin' | 'editor' }): Promise<void> {
  await api('/api/admin/users', { method: 'POST', body: JSON.stringify(u) });
  await refreshUsers();
}

export async function deleteUser(username: string): Promise<void> {
  await api(`/api/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
  await refreshUsers();
}

// ──────────── Admin session ────────────
export function currentSession(): { username: string; role: string } | null {
  return cache.currentAdmin;
}

export async function authenticate(username: string, password: string): Promise<{ username: string; role: 'admin' | 'editor' } | null> {
  try {
    const res = await api<{ username: string; role: 'admin' | 'editor' }>('/api/admin/login', {
      method: 'POST', body: JSON.stringify({ username, password })
    });
    cache.currentAdmin = res;
    // Refresh admin-only data sets
    await Promise.all([refreshProducts(), refreshOrders(), refreshCustomerAccounts(), refreshUsers()]);
    notifyStore();
    return res;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try { await api('/api/admin/logout', { method: 'POST' }); } catch { /* ignore */ }
  cache.currentAdmin = null;
  cache.orders = []; cache.customers = []; cache.users = [];
  notifyStore();
}

// ──────────── Content ────────────
export function getContent(): SiteContent {
  return cache.content;
}

export async function setContent(c: SiteContent): Promise<void> {
  await api('/api/content', { method: 'PUT', body: JSON.stringify(c) });
  cache.content = c;
  applyTranslationOverrides(c);
  notifyStore();
}

// ──────────── Image upload ────────────
export async function uploadImage(file: File): Promise<{ url: string; variants: string[] }> {
  if (!file.type.startsWith('image/')) throw new Error('请选择图片文件');
  if (file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10MB');
  const fd = new FormData();
  fd.append('file', file);
  return api<{ url: string; variants: string[] }>('/api/uploads', { method: 'POST', body: fd });
}

// ──────────── Contact enquiries ────────────
export interface ContactInquiry {
  id: string;
  name: string;
  nationality: string;
  phone: string;
  email: string;
  intent: string;
  language?: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export async function submitContactInquiry(input: Omit<ContactInquiry, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<{ id: string }> {
  return api<{ id: string }>('/api/contact', { method: 'POST', body: JSON.stringify(input) });
}

export async function listContactInquiries(): Promise<ContactInquiry[]> {
  return api<ContactInquiry[]>('/api/contact/admin');
}

export async function updateContactInquiryStatus(id: string, status: ContactInquiry['status']): Promise<void> {
  await api(`/api/contact/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export async function deleteContactInquiry(id: string): Promise<void> {
  await api(`/api/contact/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export interface AnalyticsSummary {
  totals: { views: number; visitors: number; viewsToday: number; visitorsToday: number; views30: number };
  daily: { date: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; views: number }[];
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return api<AnalyticsSummary>('/api/analytics/admin');
}

export async function trackPageView(path: string, language: string): Promise<void> {
  const key = 'therabo.analytics.session';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, sessionId);
  }
  const device = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
  await api('/api/analytics/view', {
    method: 'POST',
    body: JSON.stringify({ sessionId, path, language, device, referrer: document.referrer })
  });
}

// ──────────── Payment methods discovery ────────────
export async function fetchPaymentMethods(): Promise<{ stripe: boolean; alipay: boolean; wechat: boolean }> {
  try { return await api<{ stripe: boolean; alipay: boolean; wechat: boolean }>('/api/payments/methods'); }
  catch { return { stripe: false, alipay: false, wechat: false }; }
}

export async function startStripeCheckout(orderId: string): Promise<string> {
  const r = await api<{ url: string }>('/api/payments/stripe/checkout', {
    method: 'POST', body: JSON.stringify({ orderId })
  });
  return r.url;
}

export async function startAlipayCheckout(orderId: string): Promise<string> {
  const r = await api<{ url: string }>('/api/payments/alipay/checkout', {
    method: 'POST', body: JSON.stringify({ orderId })
  });
  return r.url;
}

export async function startWechatCheckout(orderId: string): Promise<string> {
  const r = await api<{ codeUrl: string }>('/api/payments/wechat/checkout', {
    method: 'POST', body: JSON.stringify({ orderId })
  });
  return r.codeUrl;
}

// Compatibility alias (was used by previous components calling `resetStore`)
export function resetStore(): void {
  console.warn('[therabo] resetStore() is a no-op since the move to a real backend.');
}

// ════════════════════════════════════════════════════════════════════
//  Marketing / Promotions / Discounts (new admin features)
// ════════════════════════════════════════════════════════════════════

export interface Promotion {
  id: string;
  kind: 'popup' | 'topbar';
  enabled: boolean;
  title: Record<string, string>;
  body:  Record<string, string>;
  ctaLabel?: Record<string, string> | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  background?: string | null;
  textColor?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  showOnce: boolean;
  priority: number;
  createdAt?: string;
}

export async function fetchActivePromotions(): Promise<Promotion[]> {
  return api<Promotion[]>('/api/promotions/active');
}
export async function listAllPromotions(): Promise<Promotion[]> {
  return api<Promotion[]>('/api/promotions');
}
export async function upsertPromotion(p: Promotion): Promise<void> {
  if (p.id) await api(`/api/promotions/${encodeURIComponent(p.id)}`, { method: 'PUT', body: JSON.stringify(p) });
  else await api('/api/promotions', { method: 'POST', body: JSON.stringify(p) });
}
export async function deletePromotion(id: string): Promise<void> {
  await api(`/api/promotions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export interface DiscountCode {
  code: string;
  kind: 'percent' | 'fixed' | 'free_shipping';
  amount: number;
  currency?: 'USD' | 'CNY' | null;
  minSubtotal: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  uses: number;
  active: boolean;
  description?: string;
}

export async function listDiscounts(): Promise<DiscountCode[]> {
  return api<DiscountCode[]>('/api/discounts');
}
export async function upsertDiscount(d: DiscountCode, isNew: boolean): Promise<void> {
  if (isNew) await api('/api/discounts', { method: 'POST', body: JSON.stringify(d) });
  else await api(`/api/discounts/${encodeURIComponent(d.code)}`, { method: 'PUT', body: JSON.stringify(d) });
}
export async function deleteDiscount(code: string): Promise<void> {
  await api(`/api/discounts/${encodeURIComponent(code)}`, { method: 'DELETE' });
}
export async function validateDiscountCode(code: string, subtotal: number, currency: 'USD' | 'CNY')
  : Promise<{ ok: boolean; code: string; kind?: string; amount: number; reason?: string }> {
  return api('/api/discounts/validate', { method: 'POST', body: JSON.stringify({ code, subtotal, currency }) });
}

// ════════════════════════════════════════════════════════════════════
//  Email center
// ════════════════════════════════════════════════════════════════════

export interface EmailTemplate { id: string; name: string; subject: string; body_html: string; kind: 'system' | 'marketing'; updated_at?: string }
export interface EmailCampaign { id: string; name: string; subject: string; body_html: string; status: string; sent_count: number; failed_count: number; sent_at?: string; created_at?: string; audience: string }
export interface EmailLog { id: number; to_addr: string; subject: string; kind: string; status: 'sent' | 'failed'; error?: string; sent_at: string }
export interface Subscriber { email: string; language?: string; source?: string; created_at: string; unsubscribed: number }

export async function listEmailTemplates(): Promise<EmailTemplate[]> { return api('/api/emails/templates'); }
export async function upsertEmailTemplate(t: EmailTemplate): Promise<void> {
  await api(`/api/emails/templates/${encodeURIComponent(t.id)}`, { method: 'PUT', body: JSON.stringify(t) });
}
export async function deleteEmailTemplate(id: string): Promise<void> {
  await api(`/api/emails/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function sendTestEmail(input: { to: string; templateId?: string; subject?: string; body_html?: string }): Promise<{ ok: boolean }> {
  return api('/api/emails/test', { method: 'POST', body: JSON.stringify(input) });
}
export async function listCampaigns(): Promise<EmailCampaign[]> { return api('/api/emails/campaigns'); }
export async function createCampaign(input: {
  name: string; templateId?: string; subject: string; body_html: string;
  audience: { kind: string; days?: number }; sendNow?: boolean;
}): Promise<{ id: string }> { return api('/api/emails/campaigns', { method: 'POST', body: JSON.stringify(input) }); }
export async function sendCampaignNow(id: string): Promise<{ sent: number; failed: number }> {
  return api(`/api/emails/campaigns/${encodeURIComponent(id)}/send`, { method: 'POST' });
}
export async function listEmailLogs(): Promise<EmailLog[]> { return api('/api/emails/logs'); }

export async function getSmtpSettings(): Promise<Record<string, unknown>> { return api('/api/emails/settings'); }
export async function saveSmtpSettings(v: Record<string, unknown>): Promise<void> {
  await api('/api/emails/settings', { method: 'PUT', body: JSON.stringify(v) });
}

export async function listSubscribers(): Promise<Subscriber[]> { return api('/api/emails/subscribers'); }
export async function deleteSubscriber(email: string): Promise<void> {
  await api(`/api/emails/subscribers/${encodeURIComponent(email)}`, { method: 'DELETE' });
}
export async function subscribeNewsletter(email: string, language?: string, source?: string): Promise<void> {
  await api('/api/emails/subscribe', { method: 'POST', body: JSON.stringify({ email, language, source }) });
}

// ════════════════════════════════════════════════════════════════════
//  Shipping
// ════════════════════════════════════════════════════════════════════

export interface ShippingMethod {
  id: string;
  name: Record<string, string>;
  countries: string[];
  currency: 'USD' | 'CNY';
  flatFee: number;
  freeThreshold?: number | null;
  estDays?: string | null;
  enabled: boolean;
  sortOrder: number;
  feeForOrder?: number;     // populated by /available only
}

export async function listShippingMethods(): Promise<ShippingMethod[]> { return api('/api/shipping'); }
export async function upsertShippingMethod(s: ShippingMethod, isNew: boolean): Promise<void> {
  if (isNew) await api('/api/shipping', { method: 'POST', body: JSON.stringify(s) });
  else await api(`/api/shipping/${encodeURIComponent(s.id)}`, { method: 'PUT', body: JSON.stringify(s) });
}
export async function deleteShippingMethod(id: string): Promise<void> {
  await api(`/api/shipping/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function fetchShippingForCheckout(country: string, currency: 'USD' | 'CNY', subtotal: number): Promise<ShippingMethod[]> {
  const q = new URLSearchParams({ country, currency, subtotal: String(subtotal) });
  return api(`/api/shipping/available?${q.toString()}`);
}

// ════════════════════════════════════════════════════════════════════
//  Reviews
// ════════════════════════════════════════════════════════════════════

export interface Review {
  id: string; productId: string; authorName: string; authorEmail?: string;
  rating: number; title?: string; body: string; language?: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string;
}

export async function fetchReviews(productId?: string): Promise<Review[]> {
  const q = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return api(`/api/reviews${q}`);
}
export async function submitReview(input: {
  productId: string; authorName: string; authorEmail?: string;
  rating: number; title?: string; body: string; language?: string;
}): Promise<{ id: string; status: string }> {
  return api('/api/reviews', { method: 'POST', body: JSON.stringify(input) });
}
export async function listAdminReviews(status?: string): Promise<Review[]> {
  const q = status ? `?status=${status}` : '';
  return api(`/api/reviews/admin${q}`);
}
export async function setReviewStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  await api(`/api/reviews/admin/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
export async function deleteReview(id: string): Promise<void> {
  await api(`/api/reviews/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════════════
//  CMS pages
// ════════════════════════════════════════════════════════════════════

export interface CmsPage {
  slug: string;
  title: Record<string, string>;
  bodyHtml: Record<string, string>;
  showInFooter: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export async function listFooterPages(): Promise<CmsPage[]> { return api('/api/pages'); }
export async function listAllPages(): Promise<CmsPage[]> { return api('/api/pages/admin/all'); }
export async function getPage(slug: string): Promise<CmsPage> { return api(`/api/pages/${encodeURIComponent(slug)}`); }
export async function upsertPage(p: CmsPage): Promise<void> {
  await api(`/api/pages/${encodeURIComponent(p.slug)}`, { method: 'PUT', body: JSON.stringify(p) });
}
export async function deletePage(slug: string): Promise<void> {
  await api(`/api/pages/${encodeURIComponent(slug)}`, { method: 'DELETE' });
}

// ════════════════════════════════════════════════════════════════════
//  Site settings
// ════════════════════════════════════════════════════════════════════

export async function fetchSettings(): Promise<Record<string, unknown>> { return api('/api/settings'); }
export async function setSetting(key: string, value: unknown): Promise<void> {
  await api(`/api/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(value) });
}

// ════════════════════════════════════════════════════════════════════
//  Audit log
// ════════════════════════════════════════════════════════════════════

export interface AuditEntry {
  id: number; ts: string; actor: string; action: string; target?: string | null; payload?: string | null;
}
export async function listAudit(filter?: { actor?: string; action?: string }): Promise<AuditEntry[]> {
  const q = new URLSearchParams();
  if (filter?.actor) q.set('actor', filter.actor);
  if (filter?.action) q.set('action', filter.action);
  const s = q.toString();
  return api(`/api/audit${s ? '?' + s : ''}`);
}

// ════════════════════════════════════════════════════════════════════
//  Inventory
// ════════════════════════════════════════════════════════════════════
export async function fetchLowStockProducts(): Promise<Product[]> {
  return api<Product[]>('/api/products/admin/low-stock');
}
