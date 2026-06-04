import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, ChevronLeft, ChevronRight, Expand, Image as ImageIcon, ShoppingCart, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CartItem, Language, Product } from '../types';
import { translations } from '../data/translations';
import ReviewsWidget from './ReviewsWidget';

interface ProductDetailPageProps {
  product: Product;
  currentLang: Language;
  currency: 'USD' | 'CNY';
  onBack: () => void;
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  shoppingEnabled?: boolean;
  showPrices?: boolean;
}

const labels = {
  en: {
    back: 'Back to products', description: 'Product description', color: 'Select color',
    selected: 'Selected', benefits: 'Benefits and details', usage: 'Recommended use',
    gallery: 'Product images', empty: 'Product images will appear here after the admin uploads them.',
    added: 'Added to cart', close: 'Close image', prev: 'Previous image', next: 'Next image'
  },
  zh: {
    back: '返回产品目录', description: '产品介绍', color: '选择颜色',
    selected: '当前选色', benefits: '产品功效与细则', usage: '推荐使用方式',
    gallery: '产品图片', empty: '管理员上传产品图片后，将在这里展示。',
    added: '已加入购物车', close: '关闭图片', prev: '上一张图片', next: '下一张图片'
  },
  ja: {
    back: '製品一覧に戻る', description: '製品紹介', color: 'カラーを選択',
    selected: '選択中', benefits: '特徴と詳細', usage: '推奨される使用方法',
    gallery: '製品画像', empty: '管理画面で画像をアップロードすると、ここに表示されます。',
    added: 'カートに追加しました', close: '画像を閉じる', prev: '前の画像', next: '次の画像'
  },
  ko: {
    back: '제품 목록으로 돌아가기', description: '제품 소개', color: '색상 선택',
    selected: '선택됨', benefits: '제품 특징 및 상세 정보', usage: '권장 사용 방법',
    gallery: '제품 이미지', empty: '관리자가 이미지를 업로드하면 여기에 표시됩니다.',
    added: '장바구니에 담았습니다', close: '이미지 닫기', prev: '이전 이미지', next: '다음 이미지'
  },
  'zh-tw': {
    back: '返回產品目錄', description: '產品介紹', color: '選擇顏色',
    selected: '目前選色', benefits: '產品功效與細則', usage: '推薦使用方式',
    gallery: '產品圖片', empty: '管理員上傳產品圖片後，將在這裡展示。',
    added: '已加入購物車', close: '關閉圖片', prev: '上一張圖片', next: '下一張圖片'
  }
};

export default function ProductDetailPage({
  product,
  currentLang,
  currency,
  onBack,
  onAddToCart,
  shoppingEnabled = true,
  showPrices = true
}: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: '', hex: '#e2e8f0' });
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);
  const t = translations[currentLang];
  const l = labels[currentLang];
  const images = product.images || [];
  const name = product.name[currentLang] || product.name.zh || product.name.en;
  const tagline = product.tagline[currentLang] || product.tagline.zh || product.tagline.en;
  const description = product.description[currentLang] || product.description.zh || product.description.en;
  const recommendedUse = product.recommendedUse[currentLang] || product.recommendedUse.zh || product.recommendedUse.en;
  const details = product.details[currentLang] || product.details.zh || product.details.en || [];
  const currentPrice = currency === 'USD' ? product.priceUSD : product.priceCNY;
  const currencySymbol = currency === 'USD' ? '$' : '¥';

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(product.sizes?.[0] || '');
    setSelectedColor(product.colors[0] || { name: '', hex: '#e2e8f0' });
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [product]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') setSelectedImage((selectedImage - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setSelectedImage((selectedImage + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, lightboxOpen, selectedImage]);

  const addToCart = () => {
    for (let i = 0; i < quantity; i += 1) {
      onAddToCart({
        product,
        selectedSize: selectedSize || 'Free Size',
        selectedColorHex: selectedColor.hex,
        selectedColorName: selectedColor.name
      });
    }
    setShowNotification(true);
    window.setTimeout(() => setShowNotification(false), 1800);
  };

  const changeImage = (step: -1 | 1) => {
    if (images.length < 2) return;
    setSelectedImage((selectedImage + step + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-[#FDFEFE] py-8 sm:py-12">
      <AnimatePresence>
        {showNotification && (
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-xl">
            <CheckCircle className="h-4 w-4 text-emerald-400" />{l.added}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button onClick={onBack} className="mb-7 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-rose-200 hover:text-rose-600">
          <ArrowLeft className="h-4 w-4" />{l.back}
        </button>

        <div className="grid gap-10 lg:grid-cols-12">
          <section className="lg:col-span-6">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{l.gallery}</p>
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              {images.length > 0 ? (
                <>
                  <button onClick={() => setLightboxOpen(true)} className="absolute inset-0 z-10 cursor-zoom-in" aria-label={l.gallery} />
                  <img src={images[selectedImage]} alt={`${name} ${selectedImage + 1}`} className="h-full w-full object-contain" />
                  <span className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-700 shadow"><Expand className="h-4 w-4" /></span>
                  {images.length > 1 && <>
                    <button onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow" aria-label={l.prev}><ChevronLeft className="h-5 w-5" /></button>
                    <button onClick={() => changeImage(1)} className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow" aria-label={l.next}><ChevronRight className="h-5 w-5" /></button>
                  </>}
                </>
              ) : (
                <div className="max-w-xs text-center text-slate-400">
                  <ImageIcon className="mx-auto mb-3 h-10 w-10 stroke-[1.5]" />
                  <p className="text-sm font-semibold leading-relaxed">{l.empty}</p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 ${selectedImage === index ? 'border-rose-500' : 'border-slate-200'}`}>
                    <img src={image} alt={`${name} ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-7 lg:col-span-6">
            <div>
              <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-700">
                {product.category === 'protective' ? t.categoryProtective : product.category === 'underwear' ? t.categoryUnderwear : t.categorySpecial}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{name}</h1>
              <p className="mt-3 text-base font-bold leading-relaxed text-rose-600">{tagline}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{l.description}</h2>
              <p className="text-sm font-semibold leading-relaxed text-slate-600">{description}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-extrabold text-slate-700">{l.color}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button key={`${color.name}-${color.hex}`} onClick={() => setSelectedColor(color)} title={color.name}
                        style={{ backgroundColor: color.hex }}
                        className={`h-8 w-8 rounded-full border-2 ${selectedColor.hex === color.hex ? 'border-rose-500 ring-4 ring-rose-100' : 'border-slate-300'}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">{l.selected}: {selectedColor.name}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-extrabold text-slate-700">{t.sizeLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes || []).map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`rounded-lg border px-3 py-2 text-xs font-black ${selectedSize === size ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'}`}>{size}</button>
                    ))}
                  </div>
                </div>
              </div>
              {(showPrices || shoppingEnabled) && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                  {showPrices && <strong className="font-mono text-3xl text-slate-950">{currencySymbol}{(currentPrice * quantity).toLocaleString()}</strong>}
                  {shoppingEnabled && <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-xl border border-slate-200">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-10 font-black text-slate-500">-</button>
                      <span className="w-8 text-center text-xs font-black">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="h-11 w-10 font-black text-slate-500">+</button>
                    </div>
                    <button onClick={addToCart} className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-rose-100">
                      <ShoppingCart className="h-4 w-4" />{t.addToCart}
                    </button>
                  </div>}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-teal-100 bg-teal-50/30 p-5 sm:p-6">
              <h2 className="mb-4 text-sm font-extrabold text-teal-800">{l.benefits}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {details.map((detail, index) => (
                  <div key={index} className="flex gap-2 rounded-xl bg-white p-3 text-xs font-bold leading-relaxed text-slate-600">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{detail}
                  </div>
                ))}
              </div>
              {recommendedUse && <div className="mt-5 border-t border-teal-100 pt-4">
                <h3 className="mb-2 text-xs font-black text-teal-800">{l.usage}</h3>
                <p className="text-xs font-semibold leading-relaxed text-slate-600">{recommendedUse}</p>
              </div>}
            </div>
          </section>
        </div>

        <ReviewsWidget productId={product.id} currentLang={currentLang} />
      </div>

      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setLightboxOpen(false)}>
            <button onClick={() => setLightboxOpen(false)} className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white" aria-label={l.close}><X className="h-5 w-5" /></button>
            {images.length > 1 && <>
              <button onClick={(event) => { event.stopPropagation(); changeImage(-1); }} className="absolute left-4 rounded-full bg-white/10 p-3 text-white" aria-label={l.prev}><ChevronLeft className="h-6 w-6" /></button>
              <button onClick={(event) => { event.stopPropagation(); changeImage(1); }} className="absolute right-4 rounded-full bg-white/10 p-3 text-white" aria-label={l.next}><ChevronRight className="h-6 w-6" /></button>
            </>}
            <img src={images[selectedImage]} alt={`${name} ${selectedImage + 1}`} onClick={(event) => event.stopPropagation()} className="max-h-[90vh] max-w-[92vw] object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
