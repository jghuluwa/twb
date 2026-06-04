import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Truck } from 'lucide-react';
import { listShippingMethods, upsertShippingMethod, deleteShippingMethod, type ShippingMethod } from './store';
import { Language } from '../types';

const LANGS: { id: Language; label: string }[] = [
  { id: 'zh', label: '简中' }, { id: 'en', label: 'English' }, { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' }, { id: 'zh-tw', label: '繁中' }
];

const empty = (): ShippingMethod => ({
  id: '', name: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  countries: ['*'], currency: 'CNY', flatFee: 0, freeThreshold: null,
  estDays: '5-7', enabled: true, sortOrder: 100
});

export default function ShippingManager() {
  const [items, setItems] = useState<ShippingMethod[]>([]);
  const [editing, setEditing] = useState<{ s: ShippingMethod; isNew: boolean } | null>(null);
  const refresh = () => listShippingMethods().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">运费规则</h1>
          <p className="text-sm text-slate-500 mt-1">按国家+币种设定运费；可设满 X 包邮门槛</p>
        </div>
        <button onClick={() => setEditing({ s: empty(), isNew: true })}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> 新增运费规则
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">名称</th>
              <th className="text-left px-5 py-3">国家</th>
              <th className="text-right px-5 py-3">币种</th>
              <th className="text-right px-5 py-3">运费</th>
              <th className="text-right px-5 py-3">满包邮</th>
              <th className="text-center px-5 py-3">天数</th>
              <th className="text-center px-5 py-3">启用</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-extrabold flex items-center gap-2"><Truck className="w-4 h-4 text-rose-500" />{s.name.zh || s.name.en}</td>
                <td className="px-5 py-3 text-xs">{s.countries.join(', ')}</td>
                <td className="px-5 py-3 text-right font-mono">{s.currency}</td>
                <td className="px-5 py-3 text-right font-mono font-black">{s.flatFee}</td>
                <td className="px-5 py-3 text-right font-mono text-xs">{s.freeThreshold ?? '—'}</td>
                <td className="px-5 py-3 text-center text-xs">{s.estDays || '—'}</td>
                <td className="px-5 py-3 text-center text-xs font-black">{s.enabled ? '✓' : '✗'}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setEditing({ s: { ...s }, isNew: false })} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('删除该运费规则？')) deleteShippingMethod(s.id).then(refresh); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <Editor s={editing.s} isNew={editing.isNew} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function Editor({ s, isNew, onCancel, onSaved }: { s: ShippingMethod; isNew: boolean; onCancel: () => void; onSaved: () => void }) {
  const [d, setD] = useState<ShippingMethod>(s);
  const [countriesStr, setCountriesStr] = useState(s.countries.join(', '));
  const save = async () => {
    try {
      const next = { ...d, countries: countriesStr.split(',').map((x) => x.trim()).filter(Boolean) };
      if (next.countries.length === 0) next.countries = ['*'];
      await upsertShippingMethod(next, isNew); onSaved();
    } catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-lg">{isNew ? '新增' : '编辑'} 运费规则</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {LANGS.map(({ id, label }) => (
            <div key={id}><label className="lab">名称（{label}）</label>
              <input value={d.name[id] || ''} onChange={(e) => setD({ ...d, name: { ...d.name, [id]: e.target.value } })} className="ip" />
            </div>
          ))}
          <div><label className="lab">国家（逗号分隔；用 * 表示任何国家）</label>
            <input value={countriesStr} onChange={(e) => setCountriesStr(e.target.value)} className="ip" placeholder="China, 中国 / *" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lab">币种</label>
              <select value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value as 'CNY' | 'USD' })} className="ip">
                <option value="CNY">CNY</option><option value="USD">USD</option>
              </select>
            </div>
            <div><label className="lab">预计天数</label><input value={d.estDays || ''} onChange={(e) => setD({ ...d, estDays: e.target.value })} className="ip" placeholder="3-5" /></div>
            <div><label className="lab">运费</label><input type="number" value={d.flatFee} onChange={(e) => setD({ ...d, flatFee: Number(e.target.value) })} className="ip" /></div>
            <div><label className="lab">满 X 包邮（留空 = 无）</label><input type="number" value={d.freeThreshold ?? ''} onChange={(e) => setD({ ...d, freeThreshold: e.target.value ? Number(e.target.value) : null })} className="ip" /></div>
            <div><label className="lab">排序</label><input type="number" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: Number(e.target.value) })} className="ip" /></div>
          </div>
          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} /> 启用
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold cursor-pointer">取消</button>
          <button onClick={save} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
          .lab { display:block; font-size:11px; font-weight:700; color:rgb(100,116,139); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
        `}</style>
      </div>
    </div>
  );
}
