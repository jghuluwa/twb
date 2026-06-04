import { useEffect, useState } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language } from '../types';
import { translations } from '../data/translations';
import Molecule from './visuals/Molecule';
import { listFooterPages, type CmsPage } from '../admin/store';
import { useSiteContent } from '../hooks/useSiteContent';

interface FooterProps {
  currentLang: Language;
  onScrollTo: (sectionId: string) => void;
  onOpenPage: (slug: string) => void;
}

export default function Footer({ currentLang, onScrollTo, onOpenPage }: FooterProps) {
  const [showTop, setShowTop] = useState(false);
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const t = translations[currentLang];
  const siteContent = useSiteContent();
  const labels = {
    en: { innovator: 'PHOTEX Bio-Wearable Innovator', directory: 'Directory', contact: 'Contact', legal: 'Legal & Help' },
    zh: { innovator: 'PHOTEX 生态穿戴技术推动者', directory: '网站目录', contact: '联系方式', legal: '法律 / 帮助' },
    ja: { innovator: 'PHOTEX バイオウェアラブル技術', directory: 'サイト案内', contact: '連絡先', legal: '法務 / ヘルプ' },
    ko: { innovator: 'PHOTEX 바이오 웨어러블 기술', directory: '사이트 안내', contact: '연락처', legal: '법률 / 도움말' },
    'zh-tw': { innovator: 'PHOTEX 生態穿戴技術推動者', directory: '網站目錄', contact: '聯絡方式', legal: '法律 / 幫助' }
  }[currentLang];

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { listFooterPages().then(setCmsPages).catch(() => setCmsPages([])); }, []);

  const logoSvg = (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="32" cy="32" r="16" fill="#F43F5E" />
      <circle cx="68" cy="32" r="16" fill="#7DD3FC" />
      <circle cx="32" cy="68" r="16" fill="#7DD3FC" />
      <circle cx="68" cy="68" r="16" fill="#F43F5E" />
    </svg>
  );

  return (
    <footer className="relative bg-slate-950 text-slate-300 border-t border-slate-900 pt-12 pb-6 overflow-hidden">
      {/* Top flow-stream line — visual continuity from the rest of the site */}
      <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
        <div className="absolute inset-0 flow-stream-bar opacity-90" />
      </div>

      {/* Faint floating molecule in the footer */}
      <div className="absolute -top-6 right-12 opacity-25 pointer-events-none hidden md:block">
        <Molecule size={70} glow="rose" animation="float" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900">
          
          {/* Column 1: Brand details */}
          <div className="md:col-span-4 space-y-4 text-left">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onScrollTo('hero')}>
              {logoSvg}
              <div className="flex flex-col">
                <span className="font-sans text-lg font-bold tracking-tight text-white leading-none">Therabo</span>
                <span className="font-sans text-[10px] font-semibold text-slate-400 tracking-widest mt-0.5">通微宝</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xs font-sans font-semibold">
              {t.footerSlogan}
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-rose-550 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{labels.innovator}</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="md:col-span-3 text-left space-y-4">
            <h4 className="text-white text-xs font-black tracking-widest uppercase">{labels.directory}</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <button onClick={() => onScrollTo('products')} className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-white">
                  {t.navProducts}
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('science')} className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-white">
                  {t.navScience}
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('awards')} className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-white">
                  {t.navAwards}
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('about')} className="hover:text-white transition-colors cursor-pointer text-slate-400 hover:text-white">
                  {t.navAbout}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact + legal links */}
          <div className="md:col-span-5 text-left space-y-4">
            <h4 className="text-white text-xs font-black tracking-widest uppercase">
              {labels.contact}
            </h4>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
              <a href={`tel:${siteContent.contactPhone || '4009010913'}`} className="hover:text-white">{siteContent.contactPhone || '4009010913'}</a>
              <a href={`mailto:${siteContent.contactEmail || 'liufei@therabo.top'}`} className="hover:text-white">{siteContent.contactEmail || 'liufei@therabo.top'}</a>
            </div>

            {cmsPages.length > 0 && (
              <div className="pt-3 border-t border-slate-900">
                <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-2">
                  {labels.legal}
                </h4>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold">
                  {cmsPages.map((p) => (
                    <li key={p.slug}>
                      <button onClick={() => onOpenPage(p.slug)} className="text-slate-400 hover:text-white cursor-pointer">
                        {p.title[currentLang] || p.title.zh || p.title.en || p.slug}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Global certification list row & legal info */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-sans">
          
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-semibold">{t.footerRights}</p>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="font-mono text-slate-500 hover:text-slate-300">
              京ICP备2026013275号-1
            </a>
          </div>

          {/* International trust certification mockups */}
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <span className="bg-slate-900 border border-slate-850 px-2 py-1 rounded text-[9px] font-bold text-slate-400">FDA</span>
            <span className="bg-slate-900 border border-slate-850 px-2 py-1 rounded text-[9px] font-bold text-slate-400">CE</span>
            <span className="bg-slate-900 border border-slate-850 px-2 py-1 rounded text-[9px] font-bold text-slate-400">ISO 13485</span>
          </div>

        </div>

      </div>

      {/* Scroll-to-top FAB */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="totop"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center cursor-pointer"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 12px 32px -6px rgba(225,29,72,0.65)' }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
