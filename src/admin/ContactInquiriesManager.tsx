import { useEffect, useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { deleteContactInquiry, listContactInquiries, updateContactInquiryStatus, type ContactInquiry } from './store';

export default function ContactInquiriesManager() {
  const [items, setItems] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = () => listContactInquiries().then(setItems).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);
  const statusLabel = { new: '新咨询', contacted: '已联系', closed: '已完成' };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold text-slate-900">合作咨询</h1><p className="mt-1 text-sm text-slate-500">管理官网“联系我们”提交的合作意向</p></div>
    <div className="grid gap-4">
      {loading && <p className="text-sm text-slate-400">加载中…</p>}
      {!loading && items.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-400">暂无合作咨询</div>}
      {items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-slate-900">{item.name}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{item.nationality}</span><span className="text-[10px] font-mono text-slate-400">{item.id}</span></div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-500"><a href={`tel:${item.phone}`} className="flex items-center gap-1 hover:text-rose-600"><Phone className="h-3.5 w-3.5" />{item.phone}</a><a href={`mailto:${item.email}`} className="flex items-center gap-1 hover:text-rose-600"><Mail className="h-3.5 w-3.5" />{item.email}</a><span>{new Date(item.createdAt).toLocaleString()}</span></div>
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-relaxed text-slate-700">{item.intent}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={item.status} onChange={(e) => updateContactInquiryStatus(item.id, e.target.value as ContactInquiry['status']).then(refresh)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold">
              {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button onClick={() => { if (confirm('删除此咨询？')) deleteContactInquiry(item.id).then(refresh); }} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>)}
    </div>
  </div>;
}
