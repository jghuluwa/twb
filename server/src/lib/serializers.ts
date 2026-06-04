// Convert between SQLite row shapes and JSON-friendly API objects.

export interface I18n { en: string; zh: string; ja: string; ko: string; 'zh-tw': string }
export interface I18nList { en: string[]; zh: string[]; ja: string[]; ko: string[]; 'zh-tw': string[] }

export interface ProductDTO {
  id: string;
  category: 'protective' | 'underwear' | 'special';
  priceUSD: number;
  priceCNY: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  name: I18n;
  tagline: I18n;
  description: I18n;
  recommendedUse: I18n;
  details: I18nList;
  stock?: number | null;             // null = unlimited
  lowStockThreshold?: number;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductRow {
  id: string;
  category: string;
  price_usd: number;
  price_cny: number;
  sizes: string;
  colors: string;
  images: string;
  name: string;
  tagline: string;
  description: string;
  recommended_use: string;
  details: string;
  sort_order: number;
  active: number;
  stock: number | null;
  low_stock_threshold: number;
  featured: number;
  seo_title: string | null;
  seo_description: string | null;
}

const safeJSON = <T>(s: string, fallback: T): T => {
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

export function rowToProduct(r: ProductRow): ProductDTO {
  return {
    id: r.id,
    category: r.category as ProductDTO['category'],
    priceUSD: r.price_usd,
    priceCNY: r.price_cny,
    sizes: safeJSON<string[]>(r.sizes, []),
    colors: safeJSON<{ name: string; hex: string }[]>(r.colors, []),
    images: safeJSON<string[]>(r.images, []),
    name: safeJSON<I18n>(r.name, { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }),
    tagline: safeJSON<I18n>(r.tagline, { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }),
    description: safeJSON<I18n>(r.description, { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }),
    recommendedUse: safeJSON<I18n>(r.recommended_use, { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }),
    details: safeJSON<I18nList>(r.details, { en: [], zh: [], ja: [], ko: [], 'zh-tw': [] }),
    stock: r.stock,
    lowStockThreshold: r.low_stock_threshold,
    featured: !!r.featured,
    seoTitle: r.seo_title || undefined,
    seoDescription: r.seo_description || undefined
  };
}

export interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  currency: string;
  subtotal: number;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_country: string;
  customer_address: string | null;
  note: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  paid_at: string | null;
  discount_code: string | null;
  discount_amount: number;
  shipping_method_id: string | null;
  shipping_fee: number;
  tracking_number: string | null;
  shipped_at: string | null;
}

export interface OrderItemRow {
  id: number;
  order_id: string;
  product_id: string;
  product_name: string;
  selected_size: string;
  selected_color_name: string;
  selected_color_hex: string;
  quantity: number;
  unit_price: number;
}

export interface OrderDTO {
  id: string;
  createdAt: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  currency: 'USD' | 'CNY';
  subtotal: number;
  items: {
    productId: string;
    productName: string;
    selectedSize: string;
    selectedColorName: string;
    selectedColorHex: string;
    quantity: number;
    unitPrice: number;
  }[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    country: string;
    address?: string;
  };
  customerId?: string;
  note?: string;
  paymentMethod?: string;
  paymentRef?: string;
  paidAt?: string;
  discountCode?: string;
  discountAmount: number;
  shippingMethodId?: string;
  shippingFee: number;
  trackingNumber?: string;
  shippedAt?: string;
  total: number;
}

export function rowToOrder(r: OrderRow, items: OrderItemRow[]): OrderDTO {
  return {
    id: r.id,
    createdAt: r.created_at,
    status: r.status as OrderDTO['status'],
    currency: r.currency as OrderDTO['currency'],
    subtotal: r.subtotal,
    items: items.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      selectedSize: it.selected_size,
      selectedColorName: it.selected_color_name,
      selectedColorHex: it.selected_color_hex,
      quantity: it.quantity,
      unitPrice: it.unit_price
    })),
    customer: {
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone || undefined,
      country: r.customer_country,
      address: r.customer_address || undefined
    },
    customerId: r.customer_id || undefined,
    note: r.note || undefined,
    paymentMethod: r.payment_method || undefined,
    paymentRef: r.payment_ref || undefined,
    paidAt: r.paid_at || undefined,
    discountCode: r.discount_code || undefined,
    discountAmount: r.discount_amount,
    shippingMethodId: r.shipping_method_id || undefined,
    shippingFee: r.shipping_fee,
    trackingNumber: r.tracking_number || undefined,
    shippedAt: r.shipped_at || undefined,
    total: r.subtotal - r.discount_amount + r.shipping_fee
  };
}
