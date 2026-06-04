export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'zh-tw';

export interface TranslationDict {
  navProducts: string;
  navScience: string;
  navAwards: string;
  navAbout: string;
  navContact: string;
  heroBadge: string;
  heroHeadingFirst: string;
  heroHeadingHighlight: string;
  heroHeadingSecond: string;
  heroSubheading: string;
  heroCtaBuy: string;
  heroCtaScience: string;
  scienceTitle: string;
  scienceSub: string;
  ageCalcTitle: string;
  ageCalcDesc: string;
  ageLabel: string;
  noLevelLabel: string;
  healthRiskLabel: string;
  photexRestoreLabel: string;
  techRouteTitle: string;
  techRouteTraditional: string;
  techRouteTherabo: string;
  techRouteTraditionalDesc: string;
  techRouteTheraboDesc: string;
  productTitle: string;
  productSub: string;
  allProducts: string;
  categoryProtective: string;
  categoryUnderwear: string;
  categorySpecial: string;
  addToCart: string;
  addedToCart: string;
  quickView: string;
  sizeLabel: string;
  cartTitle: string;
  cartEmpty: string;
  cartTotal: string;
  checkoutBtn: string;
  paymentNotice: string;
  labTitle: string;
  labSub: string;
  labConclusion: string;
  labDataPoint1: string;
  labDataPoint2: string;
  awardsTitle: string;
  awardsSub: string;
  awardWin2022: string;
  awardWin2023: string;
  customerReviewTitle: string;
  footerSlogan: string;
  footerRights: string;
  footerContact: string;
  howToUse: string;
  nobleTitle: string;
  nobleDesc: string;
  contactEyebrow: string;
  contactTitle: string;
  contactBody: string;
  contactName: string;
  contactNationality: string;
  contactPhone: string;
  contactEmail: string;
  contactIntent: string;
  contactSubmit: string;
  contactSent: string;
}

export interface Product {
  id: string;
  category: 'protective' | 'underwear' | 'special';
  priceUSD: number;
  priceCNY: number;
  recommendedUse: Record<string, string>;
  details: Record<string, string[]>;
  name: Record<string, string>;
  tagline: Record<string, string>;
  description: Record<string, string>;
  sizes?: string[];
  colors: {
    name: string;
    hex: string;
  }[];
  // Uploaded product photo URLs (served from /uploads/...).
  // First entry is treated as the primary image when rendering cards/details.
  images?: string[];
  stock?: number | null;           // null = unlimited stock
  lowStockThreshold?: number;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColorHex: string;
  selectedColorName: string;
  quantity: number;
}
