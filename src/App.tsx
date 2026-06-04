import { useEffect, useRef, useState } from 'react';
import { Language, Product } from './types';
import { CustomerAccount } from './admin/types';
import { currentCustomer, subscribeCustomerSession, trackPageView } from './admin/store';
import { useCart } from './hooks/useCart';
import { useStorefrontView } from './hooks/useStorefrontView';
import { useCommerceConfig } from './hooks/useCommerceConfig';
import Header from './components/Header';
import Hero from './components/Hero';
import ScienceSection from './components/ScienceSection';
import ProductCatalog from './components/ProductCatalog';
import CartDrawer from './components/CartDrawer';
import AwardSection from './components/AwardSection';
import AboutAndReviews from './components/AboutAndReviews';
import Footer from './components/Footer';
import WaveBackground from './components/WaveBackground';
import ProductDetailPage from './components/ProductDetailPage';
import AuthModal from './components/AuthModal';
import AccountPage from './components/AccountPage';
import GlowFilter from './components/visuals/GlowFilter';
import PromotionOverlay from './components/PromotionOverlay';
import CookieBanner from './components/CookieBanner';
import PageView from './components/PageView';
import ContactSection from './components/ContactSection';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('zh');
  const [currency, setCurrency] = useState<'USD' | 'CNY'>('CNY');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activePageSlug, setActivePageSlug] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerAccount | null>(currentCustomer());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const catalogScrollPosition = useRef(Number(sessionStorage.getItem('therabo:catalog-scroll') || 0));
  const activeProductRef = useRef<Product | null>(null);
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
    totalCartCount
  } = useCart();
  const { view, goHome, goAccount } = useStorefrontView();
  const { shoppingEnabled, showPrices } = useCommerceConfig();

  // Subscribe to customer session changes (login, logout, profile updates)
  useEffect(() => {
    const off = subscribeCustomerSession(() => setCustomer(currentCustomer()));
    return off;
  }, []);

  useEffect(() => {
    trackPageView(window.location.pathname + window.location.hash, currentLang).catch(() => undefined);
  }, [currentLang]);

  useEffect(() => {
    activeProductRef.current = activeProduct;
  }, [activeProduct]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    const restoreCatalogPosition = () => {
      if (!activeProductRef.current) return;
      setActiveProduct(null);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo({ top: catalogScrollPosition.current, behavior: 'instant' });
      }));
    };
    window.addEventListener('popstate', restoreCatalogPosition);
    return () => {
      window.history.scrollRestoration = previous;
      window.removeEventListener('popstate', restoreCatalogPosition);
    };
  }, []);

  const handleAccountClick = () => {
    if (!customer) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    goAccount();
  };

  const openLogin = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  // Sync initial currency with language for logical defaults
  const handleLangChange = (lang: Language) => {
    setCurrentLang(lang);
    if (lang === 'en') {
      setCurrency('USD');
    } else {
      setCurrency('CNY');
    }
  };

  const handleScrollTo = (sectionId: string) => {
    if (view === 'account') goHome();
    setActiveProduct(null);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSelectProduct = (product: Product) => {
    catalogScrollPosition.current = window.scrollY;
    sessionStorage.setItem('therabo:catalog-scroll', String(window.scrollY));
    window.history.pushState({ theraboProduct: product.id }, '', `#product/${encodeURIComponent(product.id)}`);
    setActiveProduct(product);
  };

  const handleBackToCatalog = () => {
    if (window.history.state?.theraboProduct) {
      window.history.back();
      return;
    }
    setActiveProduct(null);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: catalogScrollPosition.current, behavior: 'instant' });
    }));
  };

  return (
    <div className="min-h-screen bg-[#FDFEFE] relative overflow-x-hidden">
      <GlowFilter />
      <WaveBackground />

      <PromotionOverlay currentLang={currentLang} />

      <Header
        currentLang={currentLang}
        onLangChange={handleLangChange}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={totalCartCount}
        onCartToggle={toggleCart}
        onScrollTo={handleScrollTo}
        customer={customer}
        onLoginClick={() => openLogin('login')}
        onAccountClick={handleAccountClick}
        shoppingEnabled={shoppingEnabled}
        showPrices={showPrices}
      />

      <main>
        {activePageSlug ? (
          <PageView slug={activePageSlug} currentLang={currentLang} onBack={() => setActivePageSlug(null)} />
        ) : view === 'account' ? (
          <AccountPage
            currentLang={currentLang}
            currency={currency}
            onBack={goHome}
            onRequireLogin={() => {
              goHome();
              openLogin('login');
            }}
          />
        ) : activeProduct ? (
          <ProductDetailPage
            product={activeProduct}
            currentLang={currentLang}
            currency={currency}
            onBack={handleBackToCatalog}
            onAddToCart={addToCart}
            shoppingEnabled={shoppingEnabled}
            showPrices={showPrices}
          />
        ) : (
          <>
            <Hero
              currentLang={currentLang}
              onExplore={() => handleScrollTo('products')}
              onScience={() => handleScrollTo('science')}
            />
            <ScienceSection currentLang={currentLang} />
            <ProductCatalog
              currentLang={currentLang}
              currency={currency}
              onAddToCart={addToCart}
              onSelectProduct={handleSelectProduct}
              shoppingEnabled={shoppingEnabled}
              showPrices={showPrices}
            />
            <AwardSection currentLang={currentLang} />
            <AboutAndReviews currentLang={currentLang} />
            <ContactSection currentLang={currentLang} />
          </>
        )}
      </main>

      {shoppingEnabled && (
        <CartDrawer
          currentLang={currentLang}
          currency={currency}
          cartItems={cartItems}
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          customer={customer}
          onRequestLogin={() => openLogin('login')}
          onOrderPlaced={clearCart}
        />
      )}

      <AuthModal
        currentLang={currentLang}
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setCustomer(currentCustomer())}
      />

      <Footer
        currentLang={currentLang}
        onScrollTo={handleScrollTo}
        onOpenPage={(slug) => { setActivePageSlug(slug); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
      />

      <CookieBanner currentLang={currentLang} onOpenPrivacy={() => setActivePageSlug('privacy')} />
    </div>
  );
}
