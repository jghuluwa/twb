import { useEffect, useState } from 'react';
import { Trash2, Download } from 'lucide-react';
import { listSubscribers, deleteSubscriber, downloadCsv, type Subscriber } from './store';

export default function SubscribersManager() {
  const [items, setItems] = useState<Subscriber[]>([]);
  const refresh = () => listSubscribers().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);

  const exportCsv = () => {
    const rows = [['Email', 'Language', 'Source', 'Subscribed', 'Joined'], ...items.map((s) => [
      s.email, s.language || '', s.source || '', s.unsubscribed ? 'no' : 'yes', s.created_at
    ])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    downloadCsv(`therabo-subscribers-${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">订阅者</h1>
          <p className="text-sm text-slate-500 mt-1">共 {items.length} 个邮箱 · 用于「群发」时的「订阅者」收件人范围</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer">
          <Download className="w-4 h-4" /> 导出 CSV
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">邮箱</th>
              <th className="text-left px-5 py-3">语言</th>
              <th className="text-left px-5 py-3">来源</th>
              <th className="text-center px-5 py-3">订阅中</th>
              <th className="text-right px-5 py-3">订阅时间</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400 font-bold">尚无订阅者</td></tr>}
            {items.map((s) => (
              <tr key={s.email} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-extrabold">{s.email}</td>
                <td className="px-5 py-3 text-xs">{s.language || '—'}</td>
                <td className="px-5 py-3 text-xs">{s.source || '—'}</td>
                <td className="px-5 py-3 text-center text-xs font-black">{s.unsubscribed ? '✗' : '✓'}</td>
                <td className="px-5 py-3 text-right text-xs text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => { if (confirm('删除该订阅者？')) deleteSubscriber(s.email).then(refresh); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
