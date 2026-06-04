import { Language, Product, TranslationDict } from '../types';

export type LocalizedText = Record<string, string>;

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface OrderLineItem {
  productId: string;
  productName: string;
  selectedSize: string;
  selectedColorName: string;
  selectedColorHex: string;
  quantity: number;
  unitPrice: number; // priced in order currency
}

export interface Order {
  id: string;                 // e.g. THB-20260524-0001
  createdAt: string;          // ISO timestamp
  status: OrderStatus;
  currency: 'USD' | 'CNY';
  subtotal: number;
  items: OrderLineItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    country: string;
    address?: string;
  };
  customerId?: string;        // links to CustomerAccount.id when buyer is logged in
  note?: string;
}

export interface CustomerAddress {
  id: string;
  label: string;        // e.g. "家", "公司"
  recipient: string;
  phone: string;
  country: string;
  address: string;      // street / city / postcode
  isDefault: boolean;
}

export interface CustomerAccount {
  id: string;                 // CUS-xxxxxx
  email: string;              // login key (lowercased)
  passwordHash: string;       // pseudoHash — Demo only
  name: string;
  phone?: string;
  country?: string;
  status: 'active' | 'disabled';
  addresses: CustomerAddress[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface CustomerSession {
  customerId: string;
  email: string;
  name: string;
}

export interface AdminUserAccount {
  username: string;
  passwordHash: string; // simple base64 — Demo only
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface SiteContent {
  hero: {
    badge:        LocalizedText;
    headline:     LocalizedText;
    subheading:   LocalizedText;
    heroImage?:   string;          // /uploads/... URL, optional
  };
  about: {
    title:       LocalizedText;
    body:        LocalizedText;
    aboutImage?: string;
  };
  contactEmail: string;
  contactPhone?: string;
  translations?: Partial<Record<Language, Partial<TranslationDict>>>;
}

// A trimmed customer record aggregated from orders + registered accounts
export interface CustomerRecord {
  email: string;
  name: string;
  country: string;
  orders: number;
  totalSpentCNY: number;
  totalSpentUSD: number;
  lastOrderAt: string;
  registered?: boolean;
  customerId?: string;
  status?: 'active' | 'disabled';
  createdAt?: string;
}

export interface AdminStoreShape {
  products: Product[];
  orders: Order[];
  users: AdminUserAccount[];
  customers: CustomerAccount[];
  content: SiteContent;
}
