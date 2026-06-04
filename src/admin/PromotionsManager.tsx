import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, Megaphone, Upload, Eye, EyeOff } from 'lucide-react';
import {
  listAllPromotions, upsertPromotion, deletePromotion, uploadImage,
  type Promotion
} from './store';
import { Language } from '../types';

type Lang = Language;

const LANGS: { id: Lang; label: string }[] = [
  { id: 'zh', label: '简中' }, { id: 'en', label: 'English' }, { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' }, { id: 'zh-tw', label: '繁中' }
];

const empty = (kind: 'popup' | 'topbar'): Promotion => ({
  id: '', kind, enabled: true,
  title: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  body: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  ctaLabel: null, ctaUrl: '', imageUrl: '',
  background: '#0F172A', textColor: '#FFFFFF',
  startAt: null, endAt: null,
  showOnce: true, priority: 100
});

export default function PromotionsManager() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const refresh = () => listAllPromotions().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">弹窗 / 顶栏营销</h1>
          <p className="text-sm text-slate-500 mt-1">配置首页弹窗广告与顶部公告条，按时间窗口自动展示</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(empty('popup'))}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer">
            <Plus className="w-4 h-4" /> 新增弹窗
          </button>
          <button onClick={() => setEditing(empty('topbar'))}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer">
            <Plus className="w-4 h-4" /> 新增顶栏
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">类型 / 标题</th>
              <th className="text-left px-5 py-3">展示窗口</th>
              <th className="text-center px-5 py-3">优先级</th>
              <th className="text-center px-5 py-3">状态</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-slate-400 font-bold">暂无营销活动</td></tr>}
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">{p.kind}</span>
                    <span className="font-extrabold text-slate-900">{p.title.zh || p.title.en || '(未填标题)'}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-slate-500 font-bold">
                  {p.startAt ? new Date(p.startAt).toLocaleDateString() : '不限'} → {p.endAt ? new Date(p.endAt).toLocaleDateString() : '不限'}
                </td>
                <td className="px-5 py-3 text-center text-xs font-mono font-black">{p.priority}</td>
                <td className="px-5 py-3 text-center">
                  {p.enabled
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Eye className="w-3 h-3" />启用</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full"><EyeOff className="w-3 h-3" />停用</span>}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setEditing(JSON.parse(JSON.stringify(p)))} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm('确认删除？')) deletePromotion(p.id).then(refresh); }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <Editor draft={editing} onCancel={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function Editor({ draft, onCancel, onSaved }: { draft: Promotion; onCancel: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Promotion>(draft);
  const [lang, setLang] = useState<Lang>('zh');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setI18n = <K extends 'title' | 'body' | 'ctaLabel'>(field: K, v: string) => {
    if (field === 'ctaLabel') {
      setP({ ...p, ctaLabel: { ...(p.ctaLabel || { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' }), [lang]: v } });
    } else {
      setP({ ...p, [field]: { ...p[field], [lang]: v } });
    }
  };

  const uploadHero = async (file?: File) => {
    if (!file) return;
    try { const r = await uploadImage(file); setP({ ...p, imageUrl: r.url }); }
    catch (err) { alert(err instanceof Error ? err.message : '上传失败'); }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try { await upsertPromotion(p); onSaved(); }
    catch (err) { setError(err instanceof Error ? err.message : '保存失败'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-lg text-slate-900">{p.id ? '编辑' : '新增'} {p.kind === 'popup' ? '首页弹窗' : '顶部公告条'}</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={p.enabled} onChange={(e) => setP({ ...p, enabled: e.target.checked })} />
              启用
            </label>
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={p.showOnce} onChange={(e) => setP({ ...p, showOnce: e.target.checked })} />
              {p.kind === 'popup' ? '只展示一次（按用户）' : '关闭后本会话不再显示'}
            </label>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              优先级 <input type="number" value={p.priority} onChange={(e) => setP({ ...p, priority: Number(e.target.value) })}
                className="w-16 ip" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lab">开始时间</label>
              <input type="datetime-local" value={p.startAt || ''} onChange={(e) => setP({ ...p, startAt: e.target.value || null })} className="ip" />
            </div>
            <div>
              <label className="lab">结束时间</label>
              <input type="datetime-local" value={p.endAt || ''} onChange={(e) => setP({ ...p, endAt: e.target.value || null })} className="ip" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit">
            {LANGS.map(({ id, label }) => (
              <button key={id} onClick={() => setLang(id)}
                className={`text-xs font-bold py-1.5 px-4 rounded-md cursor-pointer ${lang === id ? 'bg-white shadow' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="lab">标题</label>
            <input value={p.title[lang] || ''} onChange={(e) => setI18n('title', e.target.value)} className="ip" />
          </div>
          <div>
            <label className="lab">正文</label>
            <textarea rows={3} value={p.body[lang] || ''} onChange={(e) => setI18n('body', e.target.value)} className="ip" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lab">CTA 按钮文字</label>
              <input value={p.ctaLabel?.[lang] || ''} onChange={(e) => setI18n('ctaLabel', e.target.value)} className="ip" />
            </div>
            <div>
              <label className="lab">CTA 点击链接</label>
              <input value={p.ctaUrl || ''} onChange={(e) => setP({ ...p, ctaUrl: e.target.value })} className="ip" placeholder="https://…" />
            </div>
          </div>

          {p.kind === 'popup' && (
            <div>
              <label className="lab">弹窗顶部图片（可选）</label>
              {p.imageUrl ? (
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} alt="" className="h-24 rounded-lg border border-slate-200" />
                  <button onClick={() => setP({ ...p, imageUrl: '' })} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">移除</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 border-2 border-dashed border-slate-300 rounded-lg hover:border-rose-400 cursor-pointer w-fit">
                  <Upload className="w-3.5 h-3.5" /> 上传图片
                  <input type="file" accept="image/*" hidden onChange={(e) => uploadHero(e.target.files?.[0])} />
                </label>
              )}
            </div>
          )}

          {p.kind === 'topbar' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lab">背景色</label>
                <input type="color" value={p.background || '#0F172A'} onChange={(e) => setP({ ...p, background: e.target.value })} className="h-9 w-full rounded cursor-pointer" />
              </div>
              <div>
                <label className="lab">文字色</label>
                <input type="color" value={p.textColor || '#FFFFFF'} onChange={(e) => setP({ ...p, textColor: e.target.value })} className="h-9 w-full rounded cursor-pointer" />
              </div>
            </div>
          )}

          {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">取消</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer disabled:opacity-60">
            <Save className="w-4 h-4" /> 保存
          </button>
        </div>

        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
          .ip:focus { border-color:rgb(244,114,182); }
          .lab { display:block; font-size:11px; font-weight:700; color:rgb(100,116,139); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px; }
        `}</style>
      </div>
    </div>
  );
}
