import { useEffect, useRef, useState } from 'react';
import { Language, Product } from './types';
import { CustomerAccount } from './admin/types';
import { currentCustomer, subscribeCustomerSession, trackPageView, listProducts, subscribe as subscribeStore } from './admin/store';
import { useCart } from './hooks/useCart';
import { useRouter } from './hooks/useRouter';
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
import { applyDefaultMeta, applyProductMeta, applyNoindexMeta, removeProductJsonLd } from './lib/seo';
import { Route } from './lib/router';

export default function App() {
  const { route, navigate } = useRouter();
  const currentLang = route.lang;
  const [currency, setCurrency] = useState<'USD' | 'CNY'>(route.lang === 'en' ? 'USD' : 'CNY');
  const [products, setProducts] = useState<Product[]>(() => listProducts());
  const [customer, setCustomer] = useState<CustomerAccount | null>(currentCustomer());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const prevViewRef = useRef<Route['view']>(route.view);
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
  const { shoppingEnabled, showPrices } = useCommerceConfig();

  // Derive the visible view from the URL (single source of truth).
  const activeProduct =
    route.view === 'product' ? products.find((p) => p.id === route.productId) ?? null : null;
  const activePageSlug = route.view === 'page' ? route.pageSlug ?? null : null;
  const view: 'home' | 'account' = route.view === 'account' ? 'account' : 'home';

  // Keep the derived product list in sync with the admin store.
  useEffect(() => subscribeStore(() => setProducts(listProducts())), []);

  // Subscribe to customer session changes (login, logout, profile updates)
  useEffect(() => {
    const off = subscribeCustomerSession(() => setCustomer(currentCustomer()));
    return off;
  }, []);

  useEffect(() => {
    trackPageView(window.location.pathname + window.location.hash, currentLang).catch(() => undefined);
  }, [currentLang]);

  // Keep <title>, meta description, canonical, hreflang and social cards in
  // sync as the SPA navigates — crawlers render JS, so per-view meta + the
  // server-side injection together cover both rendering and no-JS bots.
  useEffect(() => {
    if (activeProduct) {
      applyProductMeta(activeProduct, route);
      return;
    }
    removeProductJsonLd();
    if (view === 'account') {
      applyNoindexMeta(route);
    } else {
      applyDefaultMeta(route);
    }
  }, [activeProduct, activePageSlug, view, route]);

  // Scroll management on route changes: product/page open at the top; returning
  // to the catalog (via the back button or browser back) restores its position.
  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const prev = prevViewRef.current;
    if (prev === 'product' && route.view === 'home') {
      const y = Number(sessionStorage.getItem('therabo:catalog-scroll') || 0);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      }));
    } else if (route.view === 'product' || route.view === 'page' || route.view === 'account') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    prevViewRef.current = route.view;
  }, [route]);

  const goHome = () => navigate({ lang: currentLang, view: 'home' });

  const handleAccountClick = () => {
    if (!customer) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    navigate({ lang: currentLang, view: 'account' });
  };

  const openLogin = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  // Switching language keeps the current page but swaps the URL's lang segment
  // (so /en/product/x ↔ /zh/product/x), and resets the currency default.
  const handleLangChange = (lang: Language) => {
    navigate({ ...route, lang });
    setCurrency(lang === 'en' ? 'USD' : 'CNY');
  };

  const handleScrollTo = (sectionId: string) => {
    if (route.view !== 'home') navigate({ lang: currentLang, view: 'home' });
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, route.view !== 'home' ? 160 : 100);
  };

  const handleSelectProduct = (product: Product) => {
    sessionStorage.setItem('therabo:catalog-scroll', String(window.scrollY));
    navigate({ lang: currentLang, view: 'product', productId: product.id });
  };

  const handleBackToCatalog = () => {
    if (window.history.state?.therabo) {
      window.history.back();
      return;
    }
    navigate({ lang: currentLang, view: 'home' });
  };

  const handleOpenPage = (slug: string) =>
    navigate({ lang: currentLang, view: 'page', pageSlug: slug });

  return (
    <div className="min-h-screen bg-[#04060d] text-white relative overflow-x-hidden">
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
          <PageView slug={activePageSlug} currentLang={currentLang} onBack={goHome} />
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
        onOpenPage={handleOpenPage}
      />

      <CookieBanner currentLang={currentLang} onOpenPrivacy={() => handleOpenPage('privacy')} />
    </div>
  );
}
