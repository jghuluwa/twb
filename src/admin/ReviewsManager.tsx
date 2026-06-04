import { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { listAdminReviews, setReviewStatus, deleteReview, type Review } from './store';

type Status = 'pending' | 'approved' | 'rejected' | 'all';

export default function ReviewsManager() {
  const [tab, setTab] = useState<Status>('pending');
  const [items, setItems] = useState<Review[]>([]);
  const refresh = (s: Status) => listAdminReviews(s === 'all' ? undefined : s).then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(tab); }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">评价审核</h1>
        <p className="text-sm text-slate-500 mt-1">客户提交的产品评价 → 审核通过后才会显示在产品详情页</p>
      </div>
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit">
        {(['pending', 'approved', 'rejected', 'all'] as Status[]).map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`text-xs font-bold py-1.5 px-4 rounded-md cursor-pointer ${tab === s ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
            {s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : s === 'rejected' ? '已拒绝' : '全部'}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-12 text-sm font-bold text-slate-400 bg-white border border-slate-200 rounded-2xl">暂无</div>
        )}
        {items.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-slate-400">{r.productId} · {new Date(r.createdAt).toLocaleString()}</p>
                <p className="font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-rose-500" />
                  {r.authorName} {r.authorEmail && <span className="text-xs font-bold text-slate-500">&lt;{r.authorEmail}&gt;</span>}
                  <span className="flex items-center gap-0.5 ml-2">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                  </span>
                </p>
                {r.title && <p className="text-sm font-bold text-slate-700 mt-1">{r.title}</p>}
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{r.body}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.status !== 'approved' && (
                  <button onClick={() => setReviewStatus(r.id, 'approved').then(() => refresh(tab))}
                    className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg cursor-pointer">
                    <Check className="w-3.5 h-3.5" /> 通过
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button onClick={() => setReviewStatus(r.id, 'rejected').then(() => refresh(tab))}
                    className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg cursor-pointer">
                    <X className="w-3.5 h-3.5" /> 拒绝
                  </button>
                )}
                <button onClick={() => { if (confirm('彻底删除该评价？')) deleteReview(r.id).then(() => refresh(tab)); }}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
