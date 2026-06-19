import { useState, type FormEvent } from 'react';
import { Mail, Check } from 'lucide-react';
import { Language } from '../types';
import { subscribeNewsletter } from '../admin/store';

const T = {
  en: { ph: 'Your email', cta: 'Subscribe', ok: 'Subscribed!', desc: 'Get new product alerts and member-only offers.' },
  zh: { ph: '你的邮箱', cta: '订阅', ok: '订阅成功！', desc: '订阅新品上架与会员专属优惠通知。' },
  'zh-tw': { ph: '你的電子郵件', cta: '訂閱', ok: '訂閱成功！', desc: '訂閱新品上架與會員專屬優惠通知。' }
} as const;

export default function NewsletterSignup({ currentLang }: { currentLang: Language }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = T[currentLang];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await subscribeNewsletter(email, currentLang, 'footer');
      setDone(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '订阅失败');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <p className="text-xs font-bold text-slate-400 mb-2">{t.desc}</p>
      {done ? (
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-500">
          <Check className="w-4 h-4" />{t.ok}
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email" required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.ph}
              className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white/5 border border-white/15 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button type="submit" disabled={busy}
            className="text-[#04060d] text-xs font-extrabold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer disabled:opacity-60 hover:brightness-110"
            style={{ background: 'linear-gradient(120deg, #38BDF8, #22D3EE)' }}>
            {t.cta}
          </button>
        </form>
      )}
      {error && <p className="text-[11px] font-bold text-rose-400 mt-2">{error}</p>}
    </div>
  );
}
