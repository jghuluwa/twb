import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Language } from '../types';

const KEY = 'therabo.cookie.consent';

const T = {
  en: { body: 'We use cookies to keep your cart, remember your language, and improve the site. By using Therabo you accept our cookies.', accept: 'Accept', learn: 'Learn more' },
  zh: { body: '我们使用 Cookie 来保存您的购物车、记忆语言偏好并优化体验。继续浏览即表示您同意我们的 Cookie 使用。', accept: '我同意', learn: '了解更多' },
  'zh-tw': { body: '我們使用 Cookie 來保存您的購物車、記憶語言偏好並優化體驗。繼續瀏覽即表示您同意我們的 Cookie 使用。', accept: '我同意', learn: '了解更多' }
} as const;

export default function CookieBanner({ currentLang, onOpenPrivacy }: { currentLang: Language; onOpenPrivacy: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(KEY)) setShown(true);
  }, []);
  if (!shown) return null;
  const t = T[currentLang];
  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[75] bg-[#0a0f1d]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex items-start gap-3 text-white">
      <Cookie className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-300 leading-relaxed">{t.body}</p>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={() => { localStorage.setItem(KEY, '1'); setShown(false); }}
            className="text-xs font-extrabold uppercase tracking-wider text-[#04060d] px-4 py-2 rounded-lg cursor-pointer hover:brightness-110"
            style={{ background: 'linear-gradient(120deg, #38BDF8, #22D3EE)' }}>
            {t.accept}
          </button>
          <button onClick={() => { onOpenPrivacy(); }} className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer">
            {t.learn}
          </button>
        </div>
      </div>
    </div>
  );
}
