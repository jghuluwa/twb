import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Send, X } from 'lucide-react';
import { Language } from '../types';
import { submitContactInquiry } from '../admin/store';
import Reveal from './visuals/Reveal';
import { translations } from '../data/translations';

const modalLabels: Record<Language, { title: string; close: string; error: string; again: string }> = {
  en: { title: 'Partnership enquiry', close: 'Close enquiry form', error: 'Submission failed. Please try again.', again: 'Send another enquiry' },
  zh: { title: '合作咨询', close: '关闭咨询表单', error: '提交失败，请稍后重试。', again: '再次提交咨询' },
  ja: { title: 'パートナーシップのお問い合わせ', close: 'お問い合わせフォームを閉じる', error: '送信できませんでした。もう一度お試しください。', again: '別のお問い合わせを送信' },
  ko: { title: '파트너십 문의', close: '문의 양식 닫기', error: '제출하지 못했습니다. 다시 시도해 주세요.', again: '새 문의 보내기' },
  'zh-tw': { title: '合作諮詢', close: '關閉諮詢表單', error: '提交失敗，請稍後重試。', again: '再次提交諮詢' }
};

export default function ContactSection({ currentLang }: { currentLang: Language }) {
  const t = translations[currentLang];
  const labels = modalLabels[currentLang];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', nationality: '', phone: '', email: '', intent: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await submitContactInquiry({ ...form, language: currentLang });
      setSent(true);
      setForm({ name: '', nationality: '', phone: '', email: '', intent: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, placeholder: string, type = 'text') => (
    <input type={type} required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      placeholder={placeholder} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
  );

  return (
    <>
      <section id="contact" className="relative overflow-hidden py-16 text-white sm:py-20">
        <div className="absolute inset-0 dot-grid-dark opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-px flow-stream-bar opacity-70" />
        <Reveal as="div" className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center sm:px-6">
          <p className="text-[10px] font-black tracking-[0.22em] text-cyan-300">{t.contactEyebrow}</p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{t.contactTitle}</h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-400">{t.contactBody}</p>
          <button onClick={() => { setOpen(true); setSent(false); setError(''); }}
            className="mt-6 flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-extrabold text-[#04060d] transition hover:brightness-110 cursor-pointer"
            style={{ background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)', boxShadow: '0 14px 40px -12px rgba(34,211,238,0.6)' }}>
            {t.contactSubmit}<ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>
      </section>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#0a0f1d] text-white border border-white/10 p-5 shadow-2xl sm:p-7" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black tracking-widest text-cyan-300">{t.contactEyebrow}</p>
                <h3 className="mt-1 text-xl font-extrabold text-white">{labels.title}</h3>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/10 p-2 text-slate-300 hover:text-white transition-colors cursor-pointer" aria-label={labels.close}><X className="h-5 w-5" /></button>
            </div>

            {sent ? (
              <div className="grid min-h-64 place-items-center text-center text-white">
                <div><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" /><p className="mt-4 font-extrabold">{t.contactSent}</p>
                  <button type="button" onClick={() => setSent(false)} className="mt-5 text-xs font-bold text-cyan-300 cursor-pointer">{labels.again}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {field('name', t.contactName)}
                  {field('nationality', t.contactNationality)}
                  {field('phone', t.contactPhone, 'tel')}
                  {field('email', t.contactEmail, 'email')}
                </div>
                <textarea required rows={4} value={form.intent} onChange={(event) => setForm({ ...form, intent: event.target.value })} placeholder={t.contactIntent}
                  className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20" />
                {error && <p className="mt-3 text-xs font-bold text-rose-400">{error}</p>}
                <button disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-extrabold text-[#04060d] hover:brightness-110 disabled:opacity-60 cursor-pointer"
                  style={{ background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)' }}>
                  <Send className="h-4 w-4" />{t.contactSubmit}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
