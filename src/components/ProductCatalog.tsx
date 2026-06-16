import { useState, useEffect, useRef, ReactNode, MouseEvent as ReactMouseEvent } from 'react';
import { Tag, ShoppingCart, Eye, X, Award, BadgeCheck, Sparkles, Crosshair, Wand2, Star } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { Product, Language, CartItem } from '../types';
import { products as seedProducts } from '../data/products';
import { translations } from '../data/translations';
import { listProducts, subscribe as subscribeStore } from '../admin/store';
import Reveal from './visuals/Reveal';
import Molecule from './visuals/Molecule';

interface ProductCatalogProps {
  currentLang: Language;
  currency: 'USD' | 'CNY';
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  onSelectProduct: (product: Product) => void;
  shoppingEnabled?: boolean;
  showPrices?: boolean;
}

export default function ProductCatalog({ currentLang, currency, onAddToCart, onSelectProduct, shoppingEnabled = true, showPrices = true }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'protective' | 'underwear' | 'special'>(() => {
    const saved = sessionStorage.getItem('therabo:catalog-category');
    return saved === 'protective' || saved === 'underwear' || saved === 'special' ? saved : 'all';
  });
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Live products from admin store (falls back to bundled seed data on first load)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const fromStore = listProducts();
      return fromStore.length ? fromStore : seedProducts;
    } catch { return seedProducts; }
  });

  useEffect(() => {
    const refresh = () => {
      try {
        const fromStore = listProducts();
        if (fromStore.length) setProducts(fromStore);
      } catch { /* ignore */ }
    };
    return subscribeStore(refresh);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('therabo:catalog-category', selectedCategory);
  }, [selectedCategory]);

  // Track selected sizes and colors per product id to keep the page highly interactive
  const [customConfigs, setCustomConfigs] = useState<Record<string, { size: string; colorHex: string; colorName: string }>>({});
  const [successFeedbackId, setSuccessFeedbackId] = useState<string | null>(null);

  const t = translations[currentLang];
  const productName = (prod: Product) => prod.name[currentLang] || prod.name.zh || prod.name.en;
  const productTagline = (prod: Product) => prod.tagline[currentLang] || prod.tagline.zh || prod.tagline.en;

  // Initialize or get configuration for a product
  const getProductConfig = (prod: Product) => {
    const existing = customConfigs[prod.id];
    if (existing) return existing;
    return {
      size: prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : 'Free Size',
      colorHex: prod.colors[0].hex,
      colorName: prod.colors[0].name
    };
  };

  const updateProductConfig = (prodId: string, updates: Partial<{ size: string; colorHex: string; colorName: string }>) => {
    setCustomConfigs((prev) => ({
      ...prev,
      [prodId]: {
        ...(prev[prodId] || {
          size: products.find((p) => p.id === prodId)?.sizes?.[0] || 'Free Size',
          colorHex: products.find((p) => p.id === prodId)?.colors[0].hex || '#000000',
          colorName: products.find((p) => p.id === prodId)?.colors[0].name || ''
        }),
        ...updates
      }
    }));
  };

  const handleAddClick = (prod: Product) => {
    const config = getProductConfig(prod);
    onAddToCart({
      product: prod,
      selectedSize: config.size,
      selectedColorHex: config.colorHex,
      selectedColorName: config.colorName
    });

    setSuccessFeedbackId(prod.id);
    setTimeout(() => {
      setSuccessFeedbackId(null);
    }, 1500);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  // Generates custom beautiful SVG illustrations or stylized canvas diagrams for different product lines.
  // If the admin has uploaded real product photos via the admin console, render the primary photo instead.
  const renderProductGraphic = (prod: Product, colorHex: string) => {
    if (prod.images && prod.images.length > 0) {
      return (
        <div className="relative w-full h-56 bg-[#070b14] overflow-hidden border-b border-white/10">
          <img
            src={prod.images[0]}
            alt={productName(prod)}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md py-0.5 px-1.5 rounded-md border border-white/10">
            <Molecule size={22} glow="cyan" animation="pulse" />
            <span className="text-[9px] font-mono font-black text-cyan-200/80">THERABO · NO</span>
          </div>
        </div>
      );
    }
    const brandDots = (
      <g opacity="0.8">
        <circle cx="28" cy="28" r="5" fill="#22D3EE" />
        <circle cx="42" cy="28" r="5" fill="#BAE6FD" />
        <circle cx="28" cy="42" r="5" fill="#BAE6FD" />
        <circle cx="42" cy="42" r="5" fill="#22D3EE" />
      </g>
    );

    return (
      <div className="relative w-full h-56 bg-gradient-to-br from-white/[0.07] to-white/[0.02] flex items-center justify-center p-6 border-b border-white/10 group-hover:from-cyan-500/10 group-hover:to-sky-500/5 transition-colors duration-500 overflow-hidden">

        {/* Dynamic Glowing background representing NO wave synthesis propagation */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: 'radial-gradient(60% 60% at 50% 50%, rgba(34,211,238,0.16), transparent 70%)' }} />

        {/* Custom High-fidelity Vector representation per product */}
        {prod.id === 'no-sport-knee-support' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg animate-pulse" viewBox="0 0 100 100" fill="none">
            <rect x="25" y="10" width="50" height="80" rx="15" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <path d="M25 35 Q50 45 75 35" stroke="#22D3EE" strokeWidth="2.5" opacity="0.8" />
            <path d="M25 65 Q50 75 75 65" stroke="#14B8A6" strokeWidth="2.5" opacity="0.8" />
            <circle cx="50" cy="50" r="16" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#14B8A6" strokeWidth="2" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-standard-knee-support' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <rect x="25" y="10" width="50" height="80" rx="15" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <path d="M25 35 Q50 40 75 35" stroke="#E5E7EB" strokeWidth="2" opacity="0.5" />
            <path d="M25 65 Q50 70 75 65" stroke="#E5E7EB" strokeWidth="2" opacity="0.5" />
            <rect x="35" y="42" width="30" height="16" rx="8" fill="#FEE2E2" opacity="0.7" />
            <circle cx="50" cy="50" r="6" fill="#22D3EE" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-waist-belt-fixed' && (
          <svg className="w-40 h-28 text-gray-700 drop-shadow-lg" viewBox="0 0 120 80" fill="none">
            <rect x="10" y="20" width="100" height="40" rx="12" fill={colorHex} opacity="0.85" stroke="#22D3EE" strokeWidth="1.5" />
            {/* Rigid backing ribs visual representation */}
            <line x1="45" y1="23" x2="45" y2="57" stroke="#94A3B8" strokeWidth="3" />
            <line x1="60" y1="21" x2="60" y2="59" stroke="#94A3B8" strokeWidth="3.5" />
            <line x1="75" y1="23" x2="75" y2="57" stroke="#94A3B8" strokeWidth="3" />
            <circle cx="60" cy="40" r="10" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-waist-belt-support' && (
          <svg className="w-40 h-28 text-gray-700 drop-shadow-lg" viewBox="0 0 120 80" fill="none">
            <rect x="10" y="20" width="100" height="40" rx="12" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <rect x="30" y="20" width="60" height="40" fill={colorHex} opacity="0.9" />
            {/* Hex dots for Photex weave */}
            <circle cx="45" cy="40" r="8" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="75" cy="40" r="8" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="15" y1="40" x2="105" y2="40" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-neck-collar' && (
          <svg className="w-28 h-28 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <path d="M15 40 C30 35, 70 35, 85 40 L85 62 C70 57, 30 57, 15 62 Z" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="50" cy="49" r="8" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-men-underwear' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <path d="M15 25 L85 25 L75 75 L25 75 Z" fill={colorHex} opacity="0.85" stroke="#0EA5E9" strokeWidth="1.5" rx="4" />
            <path d="M15 25 Q50 35 85 25" stroke="#0EA5E9" strokeWidth="1.5" />
            <circle cx="50" cy="55" r="10" fill="none" stroke="#22D3EE" strokeWidth="2" strokeDasharray="2 2" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-women-underwear' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <path d="M15 20 L85 20 L72 80 L28 80 Z" fill={colorHex} opacity="0.85" stroke="#EC4899" strokeWidth="1.5" rx="6" />
            <circle cx="50" cy="50" r="12" fill="none" stroke="#FF5A8F" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="6" fill="#FF5A8F" opacity="0.3" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-men-sleeve' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <path d="M30 15 L70 15 L85 30 L75 38 L68 32 L68 85 L32 85 L32 32 L25 38 L15 30 Z" fill={colorHex} opacity="0.85" stroke="#3B82F6" strokeWidth="2" />
            <circle cx="50" cy="50" r="14" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-women-sleeve' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <path d="M30 15 L70 15 L82 28 L74 36 L68 30 L68 85 L32 85 L32 30 L26 36 L18 28 Z" fill={colorHex} opacity="0.85" stroke="#EC4899" strokeWidth="2" />
            <path d="M42 15 C42 22, 58 22, 58 15" stroke="#E2E8F0" strokeWidth="2" />
            <circle cx="50" cy="52" r="14" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'therabo-therapy-boots' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            {/* Outline boot */}
            <path d="M25 15 L50 15 L50 65 L80 80 L65 90 L25 75 Z" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="37" cy="40" r="10" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="48" cy="74" r="7" fill="none" stroke="#14B8A6" strokeWidth="1.5" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-breast-patch' && (
          <svg className="w-28 h-28 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#22D3EE" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="12" fill="none" stroke="#14B8A6" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="4" fill="#22D3EE" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-eye-mask' && (
          <svg className="w-36 h-24 text-gray-700 drop-shadow-lg" viewBox="0 0 100 60" fill="none">
            <path d="M10 30 C15 15, 45 15, 50 25 C55 15, 85 15, 90 30 C85 45, 55 45, 50 35 C45 45, 15 45, 10 30 Z" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="1.5" />
            {/* Eye cover indicators */}
            <circle cx="30" cy="30" r="6" fill="none" stroke="#22D3EE" strokeWidth="1.2" strokeDasharray="2 2" />
            <circle cx="70" cy="30" r="6" fill="none" stroke="#22D3EE" strokeWidth="1.2" strokeDasharray="2 2" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-face-mask' && (
          <svg className="w-30 h-30 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" fill={colorHex} opacity="0.85" stroke="#14B8A6" strokeWidth="2" />
            {/* Eye holes, nose and mouth lines representing facial mask */}
            <ellipse cx="36" cy="42" rx="6" ry="4" stroke="#D1D5DB" strokeWidth="1.5" fill="#FAFAFB" />
            <ellipse cx="64" cy="42" rx="6" ry="4" stroke="#D1D5DB" strokeWidth="1.5" fill="#FAFAFB" />
            <path d="M50 48 L50 60 L45 61" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="50" cy="72" rx="10" ry="4" stroke="#22D3EE" strokeWidth="1.5" fill="none" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'no-gloves' && (
          <svg className="w-32 h-32 text-gray-700 drop-shadow-lg" viewBox="0 0 100 100" fill="none">
            {/* Seamless therapeutic gloves representation */}
            <path d="M30 45 L30 85 L70 85 L70 45 L65 30 L60 22 L55 30 L50 18 L45 30 L40 22 L35 30 Z" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <path d="M22 62 L32 52 L35 56" stroke="#E5E7EB" strokeWidth="2" />
            <circle cx="50" cy="62" r="10" fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="2 2" />
            {brandDots}
          </svg>
        )}

        {prod.id === 'therabo-energy-chamber' && (
          <svg className="w-40 h-28 text-gray-700 drop-shadow-lg" viewBox="0 0 120 80" fill="none">
            {/* Astronaut-style capsule */}
            <rect x="15" y="20" width="90" height="45" rx="22.5" fill={colorHex} opacity="0.85" stroke="#E5E7EB" strokeWidth="2" />
            <line x1="15" y1="42" x2="105" y2="42" stroke="#22D3EE" strokeWidth="1.5" />
            <circle cx="75" cy="42" r="16" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="45" cy="42" r="8" fill="#14B8A6" opacity="0.2" />
            {brandDots}
          </svg>
        )}

        {/* Brand watermark — live NO molecule + label */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md py-0.5 px-1.5 rounded-md border border-white/10">
          <Molecule size={22} glow="cyan" animation="pulse" />
          <span className="text-[9px] font-mono font-black text-cyan-200/80">THERABO · NO</span>
        </div>

      </div>
    );
  };

  return (
    <section id="products" className="relative py-24 text-white overflow-hidden">
      <div className="absolute inset-0 dot-grid-dark opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px flow-stream-bar opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 px-3.5 py-1 rounded-full text-xs font-bold tracking-wider mb-4 uppercase border border-cyan-500/30">
              <Tag className="w-3.5 h-3.5" />
              <span>{t.productTitle}</span>
            </div>
            <h2 className="font-sans text-3xl sm:text-4xl font-extrabold text-white tracking-tighter leading-tight">
              {t.productTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 font-semibold">
              {t.productSub}
            </p>
          </div>
        </Reveal>

        {/* Category Filters row — sliding indicator */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap justify-center gap-1 bg-white/5 border border-white/10 rounded-full p-1.5 backdrop-blur-sm">
            {([
              { id: 'all',        label: t.allProducts        },
              { id: 'protective', label: t.categoryProtective },
              { id: 'underwear',  label: t.categoryUnderwear  },
              { id: 'special',    label: t.categorySpecial    }
            ] as const).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedCategory(opt.id)}
                className={`relative font-sans text-sm font-bold py-2 px-5 rounded-full transition-colors cursor-pointer ${
                  selectedCategory === opt.id ? 'text-[#04060d]' : 'text-slate-300 hover:text-white'
                }`}
              >
                {selectedCategory === opt.id && (
                  <motion.span
                    layoutId="cat-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)', boxShadow: '0 8px 24px -8px rgba(34,211,238,0.6)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((prod, idx) => {
            const config = getProductConfig(prod);
            const currentPrice = currency === 'USD' ? prod.priceUSD : prod.priceCNY;
            const currencySymbol = currency === 'USD' ? '$' : '¥';

            return (
              <div key={prod.id}>
              <Reveal delay={idx * 0.06}>
              <TiltCard
                className="group bg-white/[0.03] rounded-3xl border border-white/10 hover:border-cyan-400/40 transition-colors duration-300 flex flex-col justify-between overflow-hidden h-full backdrop-blur-sm"
              >
                
                {/* SVG Image container */}
                <div onClick={() => onSelectProduct(prod)} className="cursor-pointer transition-opacity hover:opacity-95" title={currentLang === 'en' ? 'Click to view full details page' : '点击查看专属详情页'}>
                  {renderProductGraphic(prod, config.colorHex)}
                </div>

                {/* Content info wrapper */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  
                  {/* Category Tag & Rating row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-cyan-300 uppercase bg-cyan-500/10 border border-cyan-500/20 py-0.5 px-2.5 rounded-full">
                      {prod.category === 'protective' ? t.categoryProtective : prod.category === 'underwear' ? t.categoryUnderwear : t.categorySpecial}
                    </span>
                    {/* Star Rating */}
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[10px] text-slate-400 font-bold font-mono">4.9 / 5.0</span>
                    </div>
                  </div>

                  {/* Name and Tagline */}
                  <div className="space-y-1 cursor-pointer group" onClick={() => onSelectProduct(prod)} title={currentLang === 'en' ? 'Click to view full details page' : '点击查看专属详情页'}>
                    <h3 className="font-sans text-lg font-extrabold text-white leading-tight group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 flex-wrap">
                      <span>{productName(prod)}</span>
                      <span className="text-[10px] bg-cyan-500/15 text-cyan-200 tracking-wider py-0.5 px-2 rounded font-bold uppercase shrink-0">{t.quickView}</span>
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                      {productTagline(prod)}
                    </p>
                  </div>

                  {/* Size Drop-down selector & Colors selector row */}
                  <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-white/10">
                    
                    {/* Colors Selector */}
                    <div className="flex flex-col space-y-1 text-left">
                      <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{currentLang === 'en' ? 'Color' : '选择颜色'}</span>
                      <div className="flex items-center space-x-1.5 mt-1">
                        {prod.colors.map((c) => (
                          <button
                            key={c.hex}
                            onClick={() => updateProductConfig(prod.id, { colorHex: c.hex, colorName: c.name })}
                            title={c.name}
                            style={{ backgroundColor: c.hex }}
                            className={`w-5 h-5 rounded-full border cursor-pointer focus:outline-none transition-transform ${config.colorHex === c.hex ? 'scale-125 border-cyan-400 ring-2 ring-cyan-500/30' : 'border-white/25 hover:scale-110'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Size Selector */}
                    {prod.sizes && prod.sizes.length > 0 ? (
                      <div className="flex flex-col space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{t.sizeLabel}</span>
                        <select
                          value={config.size}
                          onChange={(e) => updateProductConfig(prod.id, { size: e.target.value })}
                          className="mt-1 text-left text-xs font-bold text-slate-200 bg-[#0a0f1d] border border-white/15 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                        >
                          {prod.sizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{t.sizeLabel}</span>
                        <span className="text-xs font-bold text-slate-300 mt-2 block">{currentLang === 'en' ? 'One Size fits all' : '均码 / 适体配对'}</span>
                      </div>
                    )}

                  </div>

                  {/* Price and CTA row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    {showPrices ? (
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">{currentLang === 'en' ? 'DTC Outright Price' : '独立站直销渠道价'}</span>
                        <span className="font-mono text-2xl font-black text-white">
                          {currencySymbol}{currentPrice.toLocaleString()}
                        </span>
                      </div>
                    ) : <div />}

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onSelectProduct(prod)}
                        className="flex items-center gap-1.5 p-2.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/20 transition-colors cursor-pointer"
                        title={currentLang === 'en' ? 'View Details and Tech Analysis' : '查看多图专属详情页与能量参数'}
                      >
                        <Eye className="w-4 h-4" />
                        {!shoppingEnabled && (
                          <span className="text-xs font-bold">{currentLang === 'en' ? 'View details' : '查看详情'}</span>
                        )}
                      </button>

                      {shoppingEnabled && (
                        <button
                          onClick={() => handleAddClick(prod)}
                          className={`flex items-center space-x-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${successFeedbackId === prod.id ? 'bg-emerald-500 text-white' : 'text-[#04060d] hover:brightness-110'}`}
                          style={successFeedbackId === prod.id ? undefined : { background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)', boxShadow: '0 8px 22px -8px rgba(34,211,238,0.6)' }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{successFeedbackId === prod.id ? t.addedToCart : t.addToCart}</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>

              </TiltCard>
              </Reveal>
              </div>
            );
          })}
        </div>

      </div>

      {/* Interactive Science Details Modal Popup */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay drop */}
          <div
            onClick={() => setSelectedProductForModal(null)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Container */}
          <div className="relative bg-[#0a0f1d] text-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 p-6 sm:p-8 shrink-0 scrollbar-thin">

            {/* Close */}
            <button
              onClick={() => setSelectedProductForModal(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5.5 h-5.5" />
            </button>

            {/* Modal Content */}
            <div className="space-y-6">

              {/* Header inside modal */}
              <div className="flex items-center space-x-3.5 pb-4 border-b border-white/10">
                <div className="p-2.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest text-cyan-300 uppercase block">
                    {selectedProductForModal.category === 'protective' ? t.categoryProtective : selectedProductForModal.category === 'underwear' ? t.categoryUnderwear : t.categorySpecial}
                  </span>
                  <h3 className="font-sans text-2xl font-extrabold text-white">
                    {selectedProductForModal.name[currentLang]}
                  </h3>
                </div>
              </div>

              {/* Tagline & Subheading */}
              <div className="space-y-2">
                <p className="font-sans text-sm font-bold text-cyan-300 inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  {selectedProductForModal.tagline[currentLang]}
                </p>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-semibold">
                  {selectedProductForModal.description[currentLang]}
                </p>
              </div>

              {/* Dual Column grid: Key indications / Efficacy list & Usage instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Specific Health Indications list */}
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1.5 mb-3"><Crosshair className="w-3.5 h-3.5 shrink-0" />CORE TARGET INDICATIONS / 调理针对症状</span>
                  <div className="space-y-2">
                    {selectedProductForModal.details[currentLang].map((detail, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span className="text-xs font-bold text-slate-200 leading-normal">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practical Recommended Use instructions */}
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold tracking-wider text-sky-300 uppercase flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 shrink-0" />HOW TO USE / 穿戴与调养方法</span>
                    <p className="text-xs font-bold text-slate-300 leading-relaxed">
                      {selectedProductForModal.recommendedUse[currentLang]}
                    </p>
                  </div>

                  {/* Certified badge check */}
                  <div className="border-t border-white/10 pt-3 mt-3 flex items-center space-x-2 text-[10px] font-bold text-cyan-300">
                    <BadgeCheck className="w-4.5 h-4.5 text-cyan-400" />
                    <span>北京晶莱国家级实验中心 2倍生发认证</span>
                  </div>
                </div>

              </div>

              {/* Lab verification chart simulator */}
              <div className="p-4 bg-black/40 text-white rounded-2xl border border-white/10 space-y-3 shadow-lg">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-[9px] font-mono tracking-widest text-cyan-300 font-bold">1-HOUR TEST METRIC / 内源提升对比</span>
                  <span className="text-[9px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded-full text-slate-300">LAB CODE: JL-2023-B</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-2 bg-white/5 rounded-xl">
                    <span className="text-[9px] text-slate-400 block tracking-tight">BEFORE WEAR / 未使用前</span>
                    <span className="font-mono text-xl font-black text-slate-300">5.2 µmol/L</span>
                  </div>
                  <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                    <span className="text-[9px] text-cyan-300 block tracking-tight">AFTER 1 HOUR WEAR / 佩戴1小时后</span>
                    <span className="font-mono text-xl font-black text-cyan-300 animate-pulse">14.1 µmol/L (+271%)</span>
                  </div>
                </div>
              </div>

              {/* Footer pricing action */}
              {(showPrices || shoppingEnabled) && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  {showPrices ? (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{currentLang === 'en' ? 'Direct Price' : '独立站到手价'}</span>
                      <span className="font-mono text-xl font-black text-white">
                        {currency === 'USD' ? '$' : '¥'}{currency === 'USD' ? selectedProductForModal.priceUSD : selectedProductForModal.priceCNY}
                      </span>
                    </div>
                  ) : <div />}

                  {shoppingEnabled && (
                    <button
                      onClick={() => {
                        handleAddClick(selectedProductForModal);
                        setSelectedProductForModal(null);
                      }}
                      className="text-[#04060d] font-black text-xs py-3 px-6 rounded-xl tracking-wider uppercase transition-all cursor-pointer hover:brightness-110"
                      style={{ background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)', boxShadow: '0 8px 22px -8px rgba(34,211,238,0.6)' }}
                    >
                      {t.addToCart}
                    </button>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </section>
  );
}

/**
 * 3D tilt card — uses mouse position to rotate on X/Y. Disabled if the user
 * prefers reduced motion. Has a faint cursor-follow glow on top.
 */
function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]),  { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]),  { stiffness: 220, damping: 22 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);

  const onMove = (e: ReactMouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top)  / rect.height);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className}`}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 1000 }}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      {/* Cursor-following glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
        style={{
          background: useTransform(
            [gx, gy] as const,
            ([x, y]) => `radial-gradient(220px circle at ${x} ${y}, rgba(34,211,238,0.18), transparent 70%)`
          )
        }}
      />
      {children}
    </motion.div>
  );
}
