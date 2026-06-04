import { useEffect, useState, useMemo, useRef, ReactNode } from 'react';
import {
  Plus, Edit2, Trash2, Search, Save, X, Copy, Image as ImageIcon, AlertCircle, Upload, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Language, Product } from '../types';
import { listProducts, refreshProducts, upsertProduct, deleteProduct, uploadImage } from './store';

type Lang = Language;
const LANGS: { id: Lang; label: string }[] = [{ id: 'zh', label: '简中' }, { id: 'en', label: 'English' }, { id: 'ja', label: '日本語' }, { id: 'ko', label: '한국어' }, { id: 'zh-tw', label: '繁中' }];

const emptyProduct = (): Product => ({
  id: '',
  category: 'protective',
  priceUSD: 0,
  priceCNY: 0,
  sizes: ['M', 'L', 'XL'],
  colors: [{ name: 'Cosmic Slate', hex: '#1F2937' }],
  images: [],
  name: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  tagline: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  description: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  recommendedUse: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  details: { en: [''], zh: [''], ja: [''], ko: [''], 'zh-tw': [''] }
});

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>(listProducts());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | Product['category']>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Pull the admin-only product list (includes inactive) when this page mounts.
  useEffect(() => { refreshProducts().then(setProducts); }, []);
  const refresh = async () => setProducts(await refreshProducts());

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.name.zh.toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const handleSave = async (p: Product) => {
    if (!p.id.trim()) {
      alert('产品 ID 不能为空');
      return;
    }
    try {
      await upsertProduct(p);
      await refresh();
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      await refresh();
      setConfirmDelete(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleDuplicate = async (p: Product) => {
    const copy: Product = JSON.parse(JSON.stringify(p));
    copy.id = `${p.id}-copy-${Date.now().toString(36)}`;
    copy.name.zh = `${copy.name.zh}（副本）`;
    copy.name.en = `${copy.name.en} (Copy)`;
    try {
      await upsertProduct(copy);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : '复制失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">产品管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {products.length} 个产品 · 支持五语编辑</p>
        </div>
        <button
          onClick={() => setEditing(emptyProduct())}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>新增产品</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索产品 ID 或名称…"
            className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1">
          {[
            { v: 'all',        label: '全部' },
            { v: 'protective', label: '护具' },
            { v: 'underwear',  label: '内衣' },
            { v: 'special',    label: '专用' }
          ].map((b) => (
            <button
              key={b.v}
              onClick={() => setCategory(b.v as 'all' | Product['category'])}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
                category === b.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">产品</th>
              <th className="text-left px-5 py-3">分类</th>
              <th className="text-right px-5 py-3">CNY</th>
              <th className="text-right px-5 py-3">USD</th>
              <th className="text-center px-5 py-3">颜色</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-400 font-bold">没有匹配的产品</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: p.colors[0]?.hex || '#e2e8f0' }}
                    >
                      <ImageIcon className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 truncate">{p.name.zh || p.name.en}</p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-black tracking-widest uppercase py-0.5 px-2 rounded-full ${
                    p.category === 'protective' ? 'bg-teal-50 text-teal-700' :
                    p.category === 'underwear'  ? 'bg-rose-50 text-rose-700' :
                                                  'bg-violet-50 text-violet-700'
                  }`}>{p.category}</span>
                </td>
                <td className="px-5 py-3 text-right font-mono font-black text-slate-900">¥{p.priceCNY.toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-mono font-bold text-slate-600">${p.priceUSD.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {p.colors.slice(0, 4).map((c) => (
                      <span key={c.hex} className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleDuplicate(p)} title="复制" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditing(JSON.parse(JSON.stringify(p)))} title="编辑" className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)} title="删除" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <ProductEditor product={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900">确认删除？</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              将永久删除产品 <span className="font-mono font-bold text-slate-900">{confirmDelete}</span>，无法恢复。
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">取消</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductEditor({
  product, onSave, onCancel
}: {
  product: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [activeLang, setActiveLang] = useState<Lang>('zh');

  const update = (patch: Partial<Product>) => setDraft({ ...draft, ...patch });
  const updateI18n = <K extends 'name' | 'tagline' | 'description' | 'recommendedUse'>(field: K, value: string) => {
    setDraft({ ...draft, [field]: { ...draft[field], [activeLang]: value } });
  };

  const updateDetailLine = (idx: number, value: string) => {
    const next = { ...draft.details };
    next[activeLang] = [...next[activeLang]];
    next[activeLang][idx] = value;
    setDraft({ ...draft, details: next });
  };

  const addDetailLine = () => {
    const next = { ...draft.details };
    next[activeLang] = [...next[activeLang], ''];
    setDraft({ ...draft, details: next });
  };

  const removeDetailLine = (idx: number) => {
    const next = { ...draft.details };
    next[activeLang] = next[activeLang].filter((_, i) => i !== idx);
    setDraft({ ...draft, details: next });
  };

  const updateSizesString = (val: string) => {
    update({ sizes: val.split(',').map((s) => s.trim()).filter(Boolean) });
  };

  const updateColor = (idx: number, patch: Partial<{ name: string; hex: string }>) => {
    const colors = [...draft.colors];
    colors[idx] = { ...colors[idx], ...patch };
    update({ colors });
  };

  const addColor = () => update({ colors: [...draft.colors, { name: 'New Color', hex: '#888888' }] });
  const removeColor = (idx: number) => update({ colors: draft.colors.filter((_, i) => i !== idx) });

  // ── Image uploads ──
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        const r = await uploadImage(f);
        urls.push(r.url);
      }
      update({ images: [...(draft.images || []), ...urls] });
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const removeImage = (idx: number) => update({ images: (draft.images || []).filter((_, i) => i !== idx) });
  const moveImageFirst = (idx: number) => {
    const arr = [...(draft.images || [])];
    const [it] = arr.splice(idx, 1);
    arr.unshift(it);
    update({ images: arr });
  };
  const moveImage = (idx: number, direction: -1 | 1) => {
    const arr = [...(draft.images || [])];
    const target = idx + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    update({ images: arr });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-lg text-slate-900">{product.id ? '编辑产品' : '新增产品'}</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basics */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="产品 ID（唯一）">
              <input type="text" value={draft.id} onChange={(e) => update({ id: e.target.value })} className="ip" placeholder="no-xxxx-xxxx" disabled={!!product.id} />
            </Field>
            <Field label="分类">
              <select value={draft.category} onChange={(e) => update({ category: e.target.value as Product['category'] })} className="ip">
                <option value="protective">康复护具</option>
                <option value="underwear">健康内衣</option>
                <option value="special">专用调理</option>
              </select>
            </Field>
            <Field label="价格 (CNY)">
              <input type="number" value={draft.priceCNY} onChange={(e) => update({ priceCNY: Number(e.target.value) })} className="ip" />
            </Field>
            <Field label="价格 (USD)">
              <input type="number" value={draft.priceUSD} onChange={(e) => update({ priceUSD: Number(e.target.value) })} className="ip" />
            </Field>
            <Field label="尺寸（逗号分隔）" full>
              <input type="text" value={(draft.sizes || []).join(', ')} onChange={(e) => updateSizesString(e.target.value)} className="ip" placeholder="M, L, XL" />
            </Field>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">产品图片 · 上传多少张，前台展示多少张</label>
              <div className="flex items-center gap-2">
                {uploading && <span className="text-[11px] font-bold text-slate-400">上传中…</span>}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> 上传图片
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>
            </div>
            {(!draft.images || draft.images.length === 0) ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center text-xs text-slate-400 font-bold">
                还没有图片 · 第一张图片将作为主图显示在产品卡片上
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {draft.images.map((url, idx) => (
                  <div key={url + idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] font-black tracking-wider uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">主图</span>
                    )}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/90 text-slate-800 disabled:opacity-30"
                        title="向前移动"
                      ><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <button
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === draft.images!.length - 1}
                        className="p-1 rounded bg-white/90 text-slate-800 disabled:opacity-30"
                        title="向后移动"
                      ><ChevronRight className="w-3.5 h-3.5" /></button>
                      {idx > 0 && (
                        <button
                          onClick={() => moveImageFirst(idx)}
                          className="text-[10px] font-bold bg-white/90 text-slate-800 px-2 py-1 rounded cursor-pointer hover:bg-white"
                          title="设为主图"
                        >设为主图</button>
                      )}
                      <button
                        onClick={() => removeImage(idx)}
                        className="text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded cursor-pointer hover:bg-rose-700"
                      >删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">颜色</label>
              <button onClick={addColor} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">+ 添加颜色</button>
            </div>
            <div className="space-y-2">
              {draft.colors.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => updateColor(idx, { hex: e.target.value })} className="w-12 h-9 rounded cursor-pointer border border-slate-200" />
                  <input type="text" value={c.hex} onChange={(e) => updateColor(idx, { hex: e.target.value })} className="ip w-28 font-mono" />
                  <input type="text" value={c.name} onChange={(e) => updateColor(idx, { name: e.target.value })} className="ip flex-1" placeholder="Color name" />
                  <button onClick={() => removeColor(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Language tabs */}
          <div>
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit mb-4">
              {LANGS.map(({ id: l, label }) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`text-xs font-bold py-1.5 px-4 rounded-md transition-colors cursor-pointer ${
                    activeLang === l ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                  {(!draft.name[l]?.trim() || !draft.description[l]?.trim()) && (
                    <span className="ml-1 text-amber-500" title="该语言内容尚未填写完整">●</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <Field label="产品名称" full>
                <input type="text" value={draft.name[activeLang] || ''} onChange={(e) => updateI18n('name', e.target.value)} className="ip" />
              </Field>
              <Field label="标语（短句）" full>
                <input type="text" value={draft.tagline[activeLang] || ''} onChange={(e) => updateI18n('tagline', e.target.value)} className="ip" />
              </Field>
              <Field label="产品描述" full>
                <textarea rows={3} value={draft.description[activeLang] || ''} onChange={(e) => updateI18n('description', e.target.value)} className="ip" />
              </Field>
              <Field label="推荐使用方式" full>
                <textarea rows={2} value={draft.recommendedUse[activeLang] || ''} onChange={(e) => updateI18n('recommendedUse', e.target.value)} className="ip" />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">功效细则</label>
                  <button onClick={addDetailLine} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">+ 添加一条</button>
                </div>
                <div className="space-y-2">
                  {(draft.details[activeLang] || []).map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-mono text-slate-400 pt-2.5 w-6 text-right">{idx + 1}.</span>
                      <textarea rows={2} value={line} onChange={(e) => updateDetailLine(idx, e.target.value)} className="ip flex-1" />
                      <button onClick={() => removeDetailLine(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded cursor-pointer mt-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">取消</button>
          <button onClick={() => onSave(draft)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer">
            <Save className="w-4 h-4" />
            保存产品
          </button>
        </div>
      </div>

      <style>{`
        .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
        .ip:focus { border-color:rgb(244,114,182); }
      `}</style>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
