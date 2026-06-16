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

  const navBtn = 'text-slate-300 hover:text-cyan-300 font-bold text-sm transition-colors py-2 cursor-pointer';

  const logoSvg = (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="transition-transform duration-300 hover:scale-105">
      {/* 2x2 alternating dots of Therabo */}
      <circle cx="32" cy="32" r="16" fill="#22D3EE" />
      <circle cx="68" cy="32" r="16" fill="#BAE6FD" />
      <circle cx="32" cy="68" r="16" fill="#BAE6FD" />
      <circle cx="68" cy="68" r="16" fill="#38BDF8" />
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 bg-[#04060d]/80 backdrop-blur-xl border-b border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onScrollTo('hero')}>
            {logoSvg}
            <div className="flex flex-col">
              <span className="font-sans text-xl font-black tracking-tight text-white leading-none">Therabo</span>
              <span className="font-sans text-[10px] font-black text-cyan-300/70 tracking-widest mt-0.5">通微宝</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => onScrollTo('products')} className={navBtn}>{t.navProducts}</button>
            <button onClick={() => onScrollTo('science')} className={navBtn}>{t.navScience}</button>
            <button onClick={() => onScrollTo('awards')} className={navBtn}>{t.navAwards}</button>
            <button onClick={() => onScrollTo('about')} className={navBtn}>{t.navAbout}</button>
            <button onClick={() => onScrollTo('contact')} className={navBtn}>{t.navContact}</button>
          </nav>

          {/* Controls & Mini-Cart */}
          <div className="hidden md:flex items-center space-x-6">

            {/* Lang dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                onBlur={() => setTimeout(() => setLangDropdownOpen(false), 200)}
                className="flex items-center space-x-1.5 text-slate-300 hover:text-white text-sm font-bold py-1.5 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{currentLang === 'zh-tw' ? '繁中' : currentLang === 'zh' ? '简中' : currentLang === 'ja' ? '日本語' : currentLang === 'ko' ? '한국어' : 'EN'}</span>
              </button>
              {langDropdownOpen && (
                <div id="lang-dropdown" className="absolute right-0 mt-2 w-32 bg-[#0a0f1d] rounded-xl shadow-2xl border border-white/10 py-1.5 z-50 backdrop-blur-xl">
                  {([
                    ['en', 'English'], ['ja', '日本語'], ['ko', '한국어'], ['zh', '简体中文'], ['zh-tw', '繁體中文']
                  ] as [Language, string][]).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => onLangChange(code)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${currentLang === code ? 'text-cyan-300 font-bold bg-cyan-500/10' : 'text-slate-300 hover:bg-white/10'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency toggle */}
            {showPrices && (
              <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => onCurrencyChange('USD')}
                  className={`text-xs font-bold py-1 px-2.5 rounded-md transition-all cursor-pointer ${currency === 'USD' ? 'bg-cyan-400/15 text-cyan-200 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => onCurrencyChange('CNY')}
                  className={`text-xs font-bold py-1 px-2.5 rounded-md transition-all cursor-pointer ${currency === 'CNY' ? 'bg-cyan-400/15 text-cyan-200 shadow-sm' : 'text-slate-400 hover:text-white'}`}
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
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-white/10 text-slate-200 transition-colors cursor-pointer max-w-[180px]"
              >
                <span className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-[#04060d] text-[11px] font-black flex items-center justify-center">
                  {customer.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-extrabold text-white truncate">{customer.name}</span>
              </button>
            ) : (
              <button
                onClick={onLoginClick}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
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
                className="relative p-2.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
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
                      className="absolute -top-1 -right-1 bg-gradient-to-br from-cyan-400 to-sky-500 text-[#04060d] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ boxShadow: '0 0 0 1.5px #04060d, 0 4px 12px rgba(34,211,238,0.6)' }}
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
            {showPrices && (
              <button
                onClick={() => onCurrencyChange(currency === 'USD' ? 'CNY' : 'USD')}
                className="text-xs font-bold py-1.5 px-2.5 bg-white/5 border border-white/10 text-slate-200 rounded-lg cursor-pointer"
              >
                {currency === 'USD' ? '$' : '¥'}
              </button>
            )}

            <button
              onClick={() => {
                const langs: Language[] = ['zh', 'en', 'ja', 'ko', 'zh-tw'];
                onLangChange(langs[(langs.indexOf(currentLang) + 1) % langs.length]);
              }}
              className="p-1.5 bg-white/5 border border-white/10 text-slate-200 rounded-lg flex items-center space-x-1 cursor-pointer"
            >
              <Globe className="w-4.5 h-4.5 text-cyan-300/80" />
              <span className="text-[10px] uppercase font-bold text-slate-200">{currentLang === 'zh-tw' ? '繁' : currentLang === 'zh' ? '简' : currentLang === 'ja' ? '日' : currentLang === 'ko' ? '한' : 'EN'}</span>
            </button>

            <button
              onClick={customer ? onAccountClick : onLoginClick}
              className="p-1.5 bg-white/5 border border-white/10 text-slate-200 rounded-lg cursor-pointer"
              title={customer ? customer.email : (currentLang === 'en' ? 'Sign in' : '登录')}
            >
              {customer
                ? <span className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-[#04060d] text-[9px] font-black flex items-center justify-center">{customer.name.slice(0,1).toUpperCase()}</span>
                : <User className="w-4 h-4" />}
            </button>

            {shoppingEnabled && (
              <button onClick={onCartToggle} className="relative p-2 text-white cursor-pointer">
                <ShoppingCart className="w-5.5 h-5.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-cyan-400 to-sky-500 text-[#04060d] text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-white/10 bg-[#04060d]/95 backdrop-blur-xl animate-fadeIn">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {([
              ['products', t.navProducts],
              ['science', t.navScience],
              ['awards', t.navAwards],
              ['about', t.navAbout],
              ['contact', t.navContact]
            ] as [string, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => { onScrollTo(id); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2.5 px-3 rounded-lg text-base font-bold text-slate-200 hover:bg-white/10 hover:text-cyan-300 transition-all cursor-pointer"
              >
                {label}
              </button>
            ))}
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
