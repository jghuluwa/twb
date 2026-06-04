import { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { listAudit, type AuditEntry } from './store';

export default function AuditViewer() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  useEffect(() => { listAudit().then(setItems).catch(() => setItems([])); }, []);
  const apply = () => listAudit({ actor: actor || undefined, action: action || undefined }).then(setItems);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-rose-600" /> 审计日志
        </h1>
        <p className="text-sm text-slate-500 mt-1">所有管理员写操作的记录（最近 500 条）</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="操作人用户名"
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none" />
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="操作前缀，如 product.update"
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none" />
        <button onClick={apply} className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">
          <Search className="w-3.5 h-3.5" /> 过滤
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">时间</th>
              <th className="text-left px-5 py-3">操作人</th>
              <th className="text-left px-5 py-3">操作</th>
              <th className="text-left px-5 py-3">目标</th>
              <th className="text-left px-5 py-3">详情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-bold">暂无日志</td></tr>}
            {items.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-xs font-mono text-slate-500">{new Date(e.ts).toLocaleString()}</td>
                <td className="px-5 py-3 text-xs font-extrabold">{e.actor}</td>
                <td className="px-5 py-3 text-xs"><code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-700">{e.action}</code></td>
                <td className="px-5 py-3 text-xs font-mono text-slate-700">{e.target || '—'}</td>
                <td className="px-5 py-3 text-[11px] text-slate-500 font-mono truncate max-w-xs" title={e.payload || ''}>{e.payload || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
