import { useEffect, useState, type ReactNode } from 'react';
import { Plus, Edit2, Trash2, X, Save, Tag } from 'lucide-react';
import { listDiscounts, upsertDiscount, deleteDiscount, type DiscountCode } from './store';

const empty = (): DiscountCode => ({
  code: '', kind: 'percent', amount: 10, currency: null,
  minSubtotal: 0, startsAt: null, endsAt: null,
  maxUses: null, uses: 0, active: true, description: ''
});

export default function DiscountsManager() {
  const [items, setItems] = useState<DiscountCode[]>([]);
  const [editing, setEditing] = useState<{ d: DiscountCode; isNew: boolean } | null>(null);
  const refresh = () => listDiscounts().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">优惠码</h1>
          <p className="text-sm text-slate-500 mt-1">支持百分比、定额减免、免运费三种规则；可限时、限次、限币种</p>
        </div>
        <button onClick={() => setEditing({ d: empty(), isNew: true })}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer">
          <Plus className="w-4 h-4" /> 新增优惠码
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">代码</th>
              <th className="text-left px-5 py-3">类型</th>
              <th className="text-right px-5 py-3">金额 / 比例</th>
              <th className="text-right px-5 py-3">已用 / 上限</th>
              <th className="text-left px-5 py-3">有效期</th>
              <th className="text-center px-5 py-3">状态</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400 font-bold">尚无优惠码</td></tr>}
            {items.map((d) => (
              <tr key={d.code} className="hover:bg-slate-50">
                <td className="px-5 py-3"><span className="font-mono font-black text-slate-900 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-rose-600" />{d.code}</span></td>
                <td className="px-5 py-3 text-xs font-bold text-slate-700">{d.kind === 'percent' ? '百分比' : d.kind === 'fixed' ? '定额减免' : '免运费'}{d.currency ? ` · ${d.currency}` : ''}</td>
                <td className="px-5 py-3 text-right font-mono font-black">{d.kind === 'percent' ? `${d.amount}%` : d.kind === 'fixed' ? `${d.amount}` : '—'}</td>
                <td className="px-5 py-3 text-right font-mono text-xs text-slate-600">{d.uses} / {d.maxUses === null || d.maxUses === undefined ? '∞' : d.maxUses}</td>
                <td className="px-5 py-3 text-xs text-slate-500 font-bold">{d.startsAt ? new Date(d.startsAt).toLocaleDateString() : '∞'} → {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : '∞'}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${d.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {d.active ? '启用' : '停用'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setEditing({ d: { ...d }, isNew: false })} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm(`确认删除 ${d.code}？`)) deleteDiscount(d.code).then(refresh); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <Editor d={editing.d} isNew={editing.isNew}
        onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function Editor({ d, isNew, onCancel, onSaved }: { d: DiscountCode; isNew: boolean; onCancel: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<DiscountCode>(d);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setError(null);
    try { await upsertDiscount(draft, isNew); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : '保存失败'); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-lg text-slate-900">{isNew ? '新增' : '编辑'} 优惠码</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="代码（大写）"><input value={draft.code} disabled={!isNew} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} className="ip" /></Field>
            <Field label="类型">
              <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as DiscountCode['kind'] })} className="ip">
                <option value="percent">百分比</option>
                <option value="fixed">定额减免</option>
                <option value="free_shipping">免运费</option>
              </select>
            </Field>
            <Field label={draft.kind === 'percent' ? '折扣 (%)' : draft.kind === 'fixed' ? '减免金额' : '金额 (忽略)'}>
              <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className="ip" />
            </Field>
            <Field label="限定币种">
              <select value={draft.currency || ''} onChange={(e) => setDraft({ ...draft, currency: (e.target.value || null) as DiscountCode['currency'] })} className="ip">
                <option value="">任意</option>
                <option value="CNY">CNY</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="最低消费金额"><input type="number" value={draft.minSubtotal} onChange={(e) => setDraft({ ...draft, minSubtotal: Number(e.target.value) })} className="ip" /></Field>
            <Field label="最大使用次数（留空 = 无限）"><input type="number" value={draft.maxUses ?? ''} onChange={(e) => setDraft({ ...draft, maxUses: e.target.value ? Number(e.target.value) : null })} className="ip" /></Field>
            <Field label="生效时间"><input type="datetime-local" value={draft.startsAt || ''} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value || null })} className="ip" /></Field>
            <Field label="过期时间"><input type="datetime-local" value={draft.endsAt || ''} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value || null })} className="ip" /></Field>
          </div>
          <Field label="描述（仅后台可见）"><input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="ip" /></Field>
          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            启用
          </label>
          {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">取消</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-60">
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>
        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>{children}</div>;
}
