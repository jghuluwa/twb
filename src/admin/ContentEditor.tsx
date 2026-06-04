import { useState, useRef, ReactNode } from 'react';
import { Save, CheckCircle2, Upload, X } from 'lucide-react';
import { getContent, setContent, uploadImage } from './store';
import { SiteContent } from './types';
import { Language, TranslationDict } from '../types';
import { translations } from '../data/translations';

const LANGS: { id: Language; label: string }[] = [
  { id: 'zh', label: '简中' }, { id: 'en', label: 'English' }, { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' }, { id: 'zh-tw', label: '繁中' }
];

export default function ContentEditor() {
  const [draft, setDraft] = useState<SiteContent>(getContent());
  const [activeLang, setActiveLang] = useState<Language>('zh');
  const [saved, setSaved] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const handleSave = async () => {
    setError(null);
    try {
      await setContent(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const aboutFileRef = useRef<HTMLInputElement | null>(null);
  const handleUpload = async (which: 'hero' | 'about', file: File | undefined) => {
    if (!file) return;
    try {
      const r = await uploadImage(file);
      if (which === 'hero') {
        setDraft({ ...draft, hero: { ...draft.hero, heroImage: r.url } });
      } else {
        setDraft({ ...draft, about: { ...draft.about, aboutImage: r.url } });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    }
  };

  const updateHero = (field: keyof SiteContent['hero'], value: string) => {
    setDraft({ ...draft, hero: { ...draft.hero, [field]: { ...draft.hero[field], [activeLang]: value } } });
  };
  const updateAbout = (field: keyof SiteContent['about'], value: string) => {
    setDraft({ ...draft, about: { ...draft.about, [field]: { ...draft.about[field], [activeLang]: value } } });
  };
  const updateGlobal = (field: keyof TranslationDict, value: string) => {
    setDraft({
      ...draft,
      translations: {
        ...(draft.translations || {}),
        [activeLang]: { ...(draft.translations?.[activeLang] || {}), [field]: value }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">内容编辑</h1>
          <p className="text-sm text-slate-500 mt-1">模板化编辑全站公共文案 · 五语支持</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? '已保存' : '保存修改'}
        </button>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 w-fit">
        {LANGS.map(({ id: l, label }) => (
          <button
            key={l}
            onClick={() => setActiveLang(l)}
            className={`text-xs font-bold py-1.5 px-4 rounded-md transition-colors cursor-pointer ${
              activeLang === l ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Hero Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Hero 主视觉</h2>
        <Field label="顶部小徽章">
          <input type="text" value={draft.hero.badge[activeLang] || ''} onChange={(e) => updateHero('badge', e.target.value)} className="ip" />
        </Field>
        <Field label="主标题">
          <textarea rows={2} value={draft.hero.headline[activeLang] || ''} onChange={(e) => updateHero('headline', e.target.value)} className="ip" />
        </Field>
        <Field label="副标题">
          <textarea rows={3} value={draft.hero.subheading[activeLang] || ''} onChange={(e) => updateHero('subheading', e.target.value)} className="ip" />
        </Field>
        <Field label="Hero 背景图（可选）">
          {draft.hero.heroImage ? (
            <div className="relative inline-block">
              <img src={draft.hero.heroImage} alt="" className="h-32 rounded-lg border border-slate-200 object-cover" />
              <button
                onClick={() => setDraft({ ...draft, hero: { ...draft.hero, heroImage: '' } })}
                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 cursor-pointer"
              ><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button
              onClick={() => heroFileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 border-2 border-dashed border-slate-300 rounded-lg hover:border-rose-400 cursor-pointer"
            ><Upload className="w-3.5 h-3.5" /> 上传 Hero 背景图</button>
          )}
          <input ref={heroFileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleUpload('hero', e.target.files?.[0])} />
        </Field>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">About 关于我们</h2>
        <Field label="标题">
          <input type="text" value={draft.about.title[activeLang] || ''} onChange={(e) => updateAbout('title', e.target.value)} className="ip" />
        </Field>
        <Field label="正文">
          <textarea rows={5} value={draft.about.body[activeLang] || ''} onChange={(e) => updateAbout('body', e.target.value)} className="ip" />
        </Field>
        <Field label="About 配图（可选）">
          {draft.about.aboutImage ? (
            <div className="relative inline-block">
              <img src={draft.about.aboutImage} alt="" className="h-32 rounded-lg border border-slate-200 object-cover" />
              <button
                onClick={() => setDraft({ ...draft, about: { ...draft.about, aboutImage: '' } })}
                className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 hover:bg-rose-700 cursor-pointer"
              ><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button
              onClick={() => aboutFileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 border-2 border-dashed border-slate-300 rounded-lg hover:border-rose-400 cursor-pointer"
            ><Upload className="w-3.5 h-3.5" /> 上传 About 配图</button>
          )}
          <input ref={aboutFileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleUpload('about', e.target.files?.[0])} />
        </Field>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">联系方式（全语言通用）</h2>
        <Field label="客服电话">
          <input type="tel" value={draft.contactPhone || '4009010913'} onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })} className="ip" />
        </Field>
        <Field label="客服邮箱">
          <input
            type="email"
            value={draft.contactEmail}
            onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
            className="ip"
          />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">全站公共文案</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">导航、科学区、产品区、购物车、页脚等模板文字。商品内容请在“产品管理”中维护。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(translations.en) as (keyof TranslationDict)[]).map((key) => (
            <div key={key}>
              <Field label={key}>
                <textarea rows={2} value={draft.translations?.[activeLang]?.[key] ?? translations[activeLang][key]} onChange={(e) => updateGlobal(key, e.target.value)} className="ip" />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
        .ip:focus { border-color:rgb(244,114,182); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
