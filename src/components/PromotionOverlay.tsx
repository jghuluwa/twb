import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types';
import { fetchActivePromotions, type Promotion } from '../admin/store';

/**
 * Renders any active promotions: 1 sticky top bar at the very top of the page,
 * and 1 modal popup over everything else. Both honour the admin's enable
 * window and "showOnce" gate (localStorage key per promo id).
 */
export default function PromotionOverlay({ currentLang }: { currentLang: Language }) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [popup, setPopup] = useState<Promotion | null>(null);
  const [dismissedTopbar, setDismissedTopbar] = useState<string | null>(
    typeof window === 'undefined' ? null : sessionStorage.getItem('therabo.topbar.dismissed')
  );

  useEffect(() => {
    fetchActivePromotions().then((list) => {
      setPromos(list);
      // Pick the first eligible popup that hasn't been shown to this user yet
      const pop = list.find((p) => {
        if (p.kind !== 'popup') return false;
        if (!p.showOnce) return true;
        return !localStorage.getItem(`therabo.popup.seen.${p.id}`);
      });
      if (pop) setPopup(pop);
    }).catch(() => undefined);
  }, []);

  const topbar = promos.find((p) => p.kind === 'topbar' && p.id !== dismissedTopbar);

  const dismissPopup = () => {
    if (popup) {
      if (popup.showOnce) localStorage.setItem(`therabo.popup.seen.${popup.id}`, '1');
      setPopup(null);
    }
  };
  const dismissTopbar = () => {
    if (!topbar) return;
    sessionStorage.setItem('therabo.topbar.dismissed', topbar.id);
    setDismissedTopbar(topbar.id);
  };

  return (
    <>
      {topbar && (
        <div
          style={{ backgroundColor: topbar.background || '#0f172a', color: topbar.textColor || '#ffffff' }}
          className="w-full text-xs font-bold py-2 px-4 flex items-center justify-center gap-3 sticky top-0 z-[70]"
        >
          <span className="truncate">{topbar.title[currentLang] || topbar.title.zh || topbar.title.en}</span>
          {topbar.ctaUrl && topbar.ctaLabel && (
            <a href={topbar.ctaUrl} target="_blank" rel="noopener noreferrer"
              className="underline font-extrabold whitespace-nowrap">
              {topbar.ctaLabel[currentLang] || topbar.ctaLabel.zh || topbar.ctaLabel.en}
            </a>
          )}
          <button onClick={dismissTopbar} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div onClick={dismissPopup} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div className="relative bg-[#0a0f1d] text-white border border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <button onClick={dismissPopup}
              className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full text-slate-300 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            {popup.imageUrl && (
              <img src={popup.imageUrl} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-6 space-y-3 text-center">
              <h3 className="text-xl font-extrabold text-white">{popup.title[currentLang] || popup.title.zh || popup.title.en}</h3>
              <p className="text-sm font-bold text-slate-300 whitespace-pre-line">{popup.body[currentLang] || popup.body.zh || popup.body.en}</p>
              {popup.ctaUrl && popup.ctaLabel && (
                <a
                  href={popup.ctaUrl}
                  onClick={dismissPopup}
                  className="inline-block text-[#04060d] font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl mt-2 hover:brightness-110"
                  style={{ background: 'linear-gradient(120deg, #38BDF8, #22D3EE)' }}
                >
                  {popup.ctaLabel[currentLang] || popup.ctaLabel.zh || popup.ctaLabel.en}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
