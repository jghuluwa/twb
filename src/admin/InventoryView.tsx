import { useEffect, useState } from 'react';
import { AlertTriangle, Package, Save } from 'lucide-react';
import { Product } from '../types';
import {
  listProducts, refreshProducts, upsertProduct, fetchLowStockProducts
} from './store';

export default function InventoryView() {
  const [items, setItems] = useState<Product[]>(listProducts());
  const [low, setLow] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { stock: string; lowStockThreshold: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    refreshProducts().then(setItems);
    fetchLowStockProducts().then(setLow).catch(() => setLow([]));
  }, []);

  const draftOf = (p: Product) => drafts[p.id] || {
    stock: p.stock === undefined || p.stock === null ? '' : String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold ?? 5)
  };
  const setDraft = (id: string, patch: Partial<{ stock: string; lowStockThreshold: string }>) => {
    setDrafts((cur) => ({ ...cur, [id]: { ...draftOf(items.find((x) => x.id === id)!), ...patch } }));
  };

  const save = async (p: Product) => {
    setSaving(p.id);
    const d = draftOf(p);
    const next: Product = {
      ...p,
      stock: d.stock === '' ? null : Number(d.stock),
      lowStockThreshold: Number(d.lowStockThreshold) || 5
    };
    try { await upsertProduct(next); await refreshProducts().then(setItems); fetchLowStockProducts().then(setLow); }
    catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
    finally { setSaving(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-rose-600" /> 库存监控</h1>
        <p className="text-sm text-slate-500 mt-1">设置每个产品的库存数量和低库存告警阈值（留空 = 不跟踪库存，永远可下单）</p>
      </div>

      {low.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-amber-800">{low.length} 个产品库存偏低</p>
            <p className="text-xs font-bold text-amber-700 mt-1">{low.map((p) => `${p.name.zh || p.name.en} (${p.stock})`).join('，')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">产品</th>
              <th className="text-right px-5 py-3">库存（留空 = 不限）</th>
              <th className="text-right px-5 py-3">低库存阈值</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => {
              const d = draftOf(p);
              const isLow = p.stock !== null && p.stock !== undefined && p.stock <= (p.lowStockThreshold ?? 5);
              return (
                <tr key={p.id} className={`${isLow ? 'bg-amber-50/40' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-3">
                    <p className="font-extrabold text-slate-900">{p.name.zh || p.name.en}</p>
                    <p className="text-[10px] font-mono text-slate-400">{p.id}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <input type="number" value={d.stock} onChange={(e) => setDraft(p.id, { stock: e.target.value })}
                      placeholder="—" className="w-24 text-right text-sm font-mono font-black bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <input type="number" value={d.lowStockThreshold} onChange={(e) => setDraft(p.id, { lowStockThreshold: e.target.value })}
                      className="w-20 text-right text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => save(p)} disabled={saving === p.id}
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline cursor-pointer disabled:opacity-60">
                      <Save className="w-3.5 h-3.5" /> {saving === p.id ? '保存中…' : '保存'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
