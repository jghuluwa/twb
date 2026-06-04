import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Language } from '../types';
import { getPage, type CmsPage } from '../admin/store';

/** Renders a CMS page (privacy / terms / faq / returns / custom). */
export default function PageView({ slug, currentLang, onBack }:
  { slug: string; currentLang: Language; onBack: () => void }) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backLabel = { en: 'Back', zh: '返回', ja: '戻る', ko: '돌아가기', 'zh-tw': '返回' }[currentLang];
  useEffect(() => {
    getPage(slug).then(setPage).catch((err) => setError(err instanceof Error ? err.message : 'not found'));
  }, [slug]);

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-rose-600 mb-6 cursor-pointer">
        <ChevronLeft className="w-4 h-4" />
        {backLabel}
      </button>
      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
      {page && (
        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-6">{page.title[currentLang] || page.title.zh || page.title.en}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.bodyHtml[currentLang] || page.bodyHtml.zh || page.bodyHtml.en || '' }} />
        </article>
      )}
    </section>
  );
}
