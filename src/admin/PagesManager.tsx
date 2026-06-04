import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, FileText, X } from 'lucide-react';
import { listAllPages, upsertPage, deletePage, type CmsPage } from './store';

type Lang = 'en' | 'zh' | 'ja' | 'ko' | 'zh-tw';
const LANGS: { id: Lang; label: string }[] = [{ id: 'zh', label: '简中' }, { id: 'en', label: 'English' }, { id: 'ja', label: '日本語' }, { id: 'ko', label: '한국어' }, { id: 'zh-tw', label: '繁中' }];

const empty = (): CmsPage => ({
  slug: '', title: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  bodyHtml: { en: '', zh: '', ja: '', ko: '', 'zh-tw': '' },
  showInFooter: true, sortOrder: 100
});

export default function PagesManager() {
  const [items, setItems] = useState<CmsPage[]>([]);
  const [editing, setEditing] = useState<{ p: CmsPage; isNew: boolean } | null>(null);
  const refresh = () => listAllPages().then(setItems).catch(() => setItems([]));
  useEffect(() => { refresh(); }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">CMS 页面</h1>
          <p className="text-sm text-slate-500 mt-1">隐私政策 / 服务条款 / FAQ / 退换货政策 等 — 五语 + 富文本</p>
        </div>
        <button onClick={() => setEditing({ p: empty(), isNew: true })}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" /> 新增页面
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Slug</th>
              <th className="text-left px-5 py-3">标题</th>
              <th className="text-center px-5 py-3">页脚显示</th>
              <th className="text-center px-5 py-3">排序</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => (
              <tr key={p.slug} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" />{p.slug}</td>
                <td className="px-5 py-3 font-extrabold">{p.title.zh || p.title.en}</td>
                <td className="px-5 py-3 text-center text-xs font-black">{p.showInFooter ? '✓' : '✗'}</td>
                <td className="px-5 py-3 text-center text-xs font-mono">{p.sortOrder}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => setEditing({ p: JSON.parse(JSON.stringify(p)), isNew: false })}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer">编辑</button>
                  <button onClick={() => { if (confirm('删除此页面？')) deletePage(p.slug).then(refresh); }}
                    className="ml-3 p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer inline"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <Editor p={editing.p} isNew={editing.isNew}
        onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function Editor({ p, isNew, onCancel, onSaved }: { p: CmsPage; isNew: boolean; onCancel: () => void; onSaved: () => void }) {
  const [d, setD] = useState<CmsPage>(p);
  const [lang, setLang] = useState<Lang>('zh');
  const save = async () => {
    if (!d.slug.trim()) { alert('请填 slug'); return; }
    try { await upsertPage(d); onSaved(); }
    catch (err) { alert(err instanceof Error ? err.message : '保存失败'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="font-extrabold text-lg">{isNew ? '新增' : '编辑'} CMS 页面</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><label className="lab">Slug（URL 路径，英文小写，例: privacy）</label>
              <input value={d.slug} disabled={!isNew} onChange={(e) => setD({ ...d, slug: e.target.value.toLowerCase() })} className="ip" />
            </div>
            <div><label className="lab">排序</label><input type="number" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: Number(e.target.value) })} className="ip" /></div>
          </div>
          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={d.showInFooter} onChange={(e) => setD({ ...d, showInFooter: e.target.checked })} /> 在页脚显示
          </label>
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit">
            {LANGS.map(({ id: l, label }) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs font-bold py-1.5 px-4 rounded-md cursor-pointer ${lang === l ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
          <div><label className="lab">标题</label>
            <input value={d.title[lang] || ''} onChange={(e) => setD({ ...d, title: { ...d.title, [lang]: e.target.value } })} className="ip" />
          </div>
          <div><label className="lab">正文（HTML — 例：&lt;p&gt;&lt;h2&gt;&lt;ul&gt;…）</label>
            <textarea rows={16} value={d.bodyHtml[lang] || ''} onChange={(e) => setD({ ...d, bodyHtml: { ...d.bodyHtml, [lang]: e.target.value } })} className="ip font-mono text-xs" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 sticky bottom-0">
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
