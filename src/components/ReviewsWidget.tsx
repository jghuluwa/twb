import { useEffect, useState, FormEvent } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Language } from '../types';
import { CustomerAccount } from '../admin/types';
import { currentCustomer, fetchReviews, submitReview, type Review } from '../admin/store';

const T = {
  en: { title: 'Customer reviews', noReviews: 'Be the first to review this product.', writeOne: 'Write a review',
    name: 'Your name', email: 'Email (optional)', body: 'Your review',
    submit: 'Submit', pending: 'Thanks! Your review will appear after approval.' },
  zh: { title: '客户评价', noReviews: '成为第一位评价此产品的用户。', writeOne: '写下你的评价',
    name: '你的姓名', email: '邮箱（可选）', body: '评价内容',
    submit: '提交', pending: '感谢分享！审核后将公开显示。' },
  ja: { title: 'カスタマーレビュー', noReviews: 'この製品の最初のレビューを投稿してください。', writeOne: 'レビューを書く',
    name: 'お名前', email: 'メール（任意）', body: 'レビュー内容',
    submit: '送信', pending: 'ありがとうございます。確認後に公開されます。' },
  ko: { title: '고객 후기', noReviews: '이 제품의 첫 후기를 작성해 주세요.', writeOne: '후기 작성',
    name: '이름', email: '이메일(선택)', body: '후기 내용',
    submit: '제출', pending: '감사합니다. 검토 후 공개됩니다.' },
  'zh-tw': { title: '顧客評價', noReviews: '成為第一位評價此產品的用戶。', writeOne: '寫下你的評價',
    name: '你的姓名', email: '電子郵件（選填）', body: '評價內容',
    submit: '提交', pending: '感謝分享！審核後將公開顯示。' }
} as const;

export default function ReviewsWidget({ productId, currentLang }: { productId: string; currentLang: Language }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const customer: CustomerAccount | null = currentCustomer();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const t = T[currentLang];

  useEffect(() => { fetchReviews(productId).then(setReviews).catch(() => setReviews([])); }, [productId]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await submitReview({ productId, authorName: name, authorEmail: email || undefined, rating, body, language: currentLang });
      setDone(true); setBody(''); setOpen(false);
    } catch (err) { setError(err instanceof Error ? err.message : t.submit); }
    finally { setBusy(false); }
  };

  return (
    <section className="mt-12 max-w-3xl mx-auto px-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-300" />
          {t.title}
          {reviews.length > 0 && (
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1 ml-2">
              {avg.toFixed(1)} <Star className="w-4 h-4 fill-amber-400" /> · {reviews.length}
            </span>
          )}
        </h3>
        <button onClick={() => setOpen(!open)} className="text-xs font-bold text-cyan-300 hover:underline cursor-pointer">
          {t.writeOne}
        </button>
      </div>

      {done && (
        <p className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-2 rounded-lg mb-4">
          {t.pending}
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)}
                className="cursor-pointer">
                <Star className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.name}
            className="w-full bg-white/5 text-sm font-bold text-white placeholder:text-slate-500 px-3 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-cyan-400" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t.email}
            className="w-full bg-white/5 text-sm font-bold text-white placeholder:text-slate-500 px-3 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-cyan-400" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder={t.body}
            className="w-full bg-white/5 text-sm font-bold text-white placeholder:text-slate-500 px-3 py-2 rounded-lg border border-white/15 focus:outline-none focus:border-cyan-400" />
          {error && <p className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={busy}
            className="text-[#04060d] font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-60 hover:brightness-110"
            style={{ background: 'linear-gradient(120deg, #38BDF8, #22D3EE)' }}>
            {t.submit}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400 font-bold text-center py-6">{t.noReviews}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-white text-sm">{r.authorName}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  ))}
                </div>
              </div>
              {r.title && <p className="text-sm font-bold text-slate-200 mt-1">{r.title}</p>}
              <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{r.body}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
