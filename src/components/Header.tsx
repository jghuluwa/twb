import { useState } from 'react';
import { ShoppingCart, Menu, X, Globe, User, LogIn } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { CustomerAccount } from '../admin/types';

interface HeaderProps {
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  currency: 'USD' | 'CNY';
  onCurrencyChange: (curr: 'USD' | 'CNY') => void;
  cartCount: number;
  onCartToggle: () => void;
  onScrollTo: (sectionId: string) => void;
  customer: CustomerAccount | null;
  onLoginClick: () => void;
  onAccountClick: () => void;
  shoppingEnabled?: boolean;
  showPrices?: boolean;
}

export default function Header({
  currentLang,
  onLangChange,
  currency,
  onCurrencyChange,
  cartCount,
  onCartToggle,
  onScrollTo,
  customer,
  onLoginClick,
  onAccountClick,
  shoppingEnabled = true,
  showPrices = true
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const t = translations[currentLang];

  const logoSvg = (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="transition-transform duration-300 hover:scale-105">
      {/* 2x2 alternating dots of Therabo */}
      <circle cx="32" cy="32" r="16" fill="#E11D48" /> {/* Rose top-left */}
      <circle cx="68" cy="32" r="16" fill="#BAE6FD" /> {/* Pale Blue top-right */}
      <circle cx="32" cy="68" r="16" fill="#BAE6FD" /> {/* Pale Blue bottom-left */}
      <circle cx="68" cy="68" r="16" fill="#E11D48" /> {/* Rose bottom-right */}
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100/90 shadow-[0_1px_2px_0_rgba(15,23,42,0.03)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onScrollTo('hero')}>
            {logoSvg}
            <div className="flex flex-col">
              <span className="font-sans text-xl font-black tracking-tight text-slate-900 leading-none">Therabo</span>
              <span className="font-sans text-[10px] font-black text-slate-400 tracking-widest mt-0.5">通微宝</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => onScrollTo('products')}
              className="text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors py-2"
            >
              {t.navProducts}
            </button>
            <button
              onClick={() => onScrollTo('science')}
              className="text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors py-2"
            >
              {t.navScience}
            </button>
            <button
              onClick={() => onScrollTo('awards')}
              className="text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors py-2"
            >
              {t.navAwards}
            </button>
            <button
              onClick={() => onScrollTo('about')}
              className="text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors py-2"
            >
              {t.navAbout}
            </button>
            <button onClick={() => onScrollTo('contact')} className="text-slate-500 hover:text-rose-600 font-bold text-sm transition-colors py-2">
              {t.navContact}
            </button>
          </nav>

          {/* Controls & Mini-Cart */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* Lang dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                onBlur={() => setTimeout(() => setLangDropdownOpen(false), 200)}
                className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 text-sm font-bold py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{currentLang === 'zh-tw' ? '繁中' : currentLang === 'zh' ? '简中' : currentLang === 'ja' ? '日本語' : currentLang === 'ko' ? '한국어' : 'EN'}</span>
              </button>
              {langDropdownOpen && (
                <div id="lang-dropdown" className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <button
                    onClick={() => onLangChange('en')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentLang === 'en' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    English
                  </button>
                  <button onClick={() => onLangChange('ja')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentLang === 'ja' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700 hover:bg-slate-50'}`}>日本語</button>
                  <button onClick={() => onLangChange('ko')} className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentLang === 'ko' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700 hover:bg-slate-50'}`}>한국어</button>
                  <button
                    onClick={() => onLangChange('zh')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentLang === 'zh' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    简体中文
                  </button>
                  <button
                    onClick={() => onLangChange('zh-tw')}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${currentLang === 'zh-tw' ? 'text-rose-600 font-bold bg-rose-50/50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    繁體中文
                  </button>
                </div>
              )}
            </div>

            {/* Currency toggle */}
            {showPrices && (
              <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-150">
                <button
                  onClick={() => onCurrencyChange('USD')}
                  className={`text-xs font-bold py-1 px-2.5 rounded-md transition-all ${currency === 'USD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => onCurrencyChange('CNY')}
                  className={`text-xs font-bold py-1 px-2.5 rounded-md transition-all ${currency === 'CNY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}
                >
                  CNY (¥)
                </button>
              </div>
            )}

            {/* Account / Login button */}
            {customer ? (
              <button
                onClick={onAccountClick}
                title={customer.email}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer max-w-[180px]"
              >
                <span className="w-6.5 h-6.5 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center">
                  {customer.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-extrabold text-slate-800 truncate">{customer.name}</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-xs font-extrabold">
                  {currentLang === 'en' ? 'Sign in' : currentLang === 'zh-tw' ? '登入 / 註冊' : '登录 / 注册'}
                </span>
              </button>
            )}

            {/* Shopping Cart button */}
            {shoppingEnabled && (
              <button
                onClick={onCartToggle}
                className="relative p-2.5 rounded-full hover:bg-slate-50 text-slate-800 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.4, opacity: 0, y: -4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 480, damping: 18 }}
                      className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                      style={{ boxShadow: '0 0 0 1.5px white, 0 4px 12px rgba(225,29,72,0.5)' }}
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center space-x-3 md:hidden">
            {/* Quick Currency toggle */}
            {showPrices && (
              <button
                onClick={() => onCurrencyChange(currency === 'USD' ? 'CNY' : 'USD')}
                className="text-xs font-bold py-1.5 px-2.5 bg-slate-50 border border-slate-150 text-slate-700 rounded-lg"
              >
                {currency === 'USD' ? '$' : '¥'}
              </button>
            )}

            {/* Quick Lang Switch */}
            <button
              onClick={() => {
                const langs: Language[] = ['zh', 'en', 'ja', 'ko', 'zh-tw'];
                onLangChange(langs[(langs.indexOf(currentLang) + 1) % langs.length]);
              }}
              className="p-1.5 bg-slate-50 border border-slate-150 text-slate-700 rounded-lg flex items-center space-x-1"
            >
              <Globe className="w-4.5 h-4.5 text-slate-400" />
              <span className="text-[10px] uppercase font-bold text-slate-700">{currentLang === 'zh-tw' ? '繁' : currentLang === 'zh' ? '简' : currentLang === 'ja' ? '日' : currentLang === 'ko' ? '한' : 'EN'}</span>
            </button>

            {/* Mobile account quick link */}
            <button
              onClick={customer ? onAccountClick : onLoginClick}
              className="p-1.5 bg-slate-50 border border-slate-150 text-slate-700 rounded-lg"
              title={customer ? customer.email : (currentLang === 'en' ? 'Sign in' : '登录')}
            >
              {customer
                ? <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">{customer.name.slice(0,1).toUpperCase()}</span>
                : <User className="w-4 h-4" />}
            </button>

            {shoppingEnabled && (
              <button
                onClick={onCartToggle}
                className="relative p-2 text-slate-800"
              >
                <ShoppingCart className="w-5.5 h-5.5 animate-pulse" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-100 bg-white shadow-inner animate-fadeIn">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <button
              onClick={() => {
                onScrollTo('products');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-750 hover:bg-slate-50 transition-all"
            >
              {t.navProducts}
            </button>
            <button
              onClick={() => {
                onScrollTo('science');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-750 hover:bg-slate-50 transition-all"
            >
              {t.navScience}
            </button>
            <button
              onClick={() => {
                onScrollTo('awards');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-750 hover:bg-slate-50 transition-all"
            >
              {t.navAwards}
            </button>
            <button
              onClick={() => {
                onScrollTo('about');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-750 hover:bg-slate-50 transition-all"
            >
              {t.navAbout}
            </button>
            <button onClick={() => { onScrollTo('contact'); setMobileMenuOpen(false); }} className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-750 hover:bg-slate-50 transition-all">
              {currentLang === 'en' ? 'Contact' : currentLang === 'ja' ? 'お問い合わせ' : currentLang === 'ko' ? '문의' : currentLang === 'zh-tw' ? '聯絡我們' : '联系我们'}
            </button>
          </div>
        </div>
      )}

      {/* Energy flow line at the bottom of the header */}
      <div className="absolute left-0 right-0 bottom-0 h-px overflow-hidden opacity-70 pointer-events-none">
        <div className="absolute inset-0 flow-stream-bar" />
      </div>
    </header>
  );
}
