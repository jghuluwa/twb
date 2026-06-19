import { useState, FormEvent, ReactNode } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, Globe2, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language } from '../types';
import { customerLogin, registerCustomer } from '../admin/store';

interface AuthModalProps {
  currentLang: Language;
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

const COPY = {
  en: {
    loginTitle: 'Sign in to Therabo',
    registerTitle: 'Create your Therabo account',
    loginSub: 'Track orders, manage addresses, and check out faster.',
    registerSub: 'Join Therabo to unlock order tracking and faster checkout.',
    email: 'Email',
    password: 'Password',
    name: 'Full name',
    phone: 'Phone (optional)',
    country: 'Country (optional)',
    signIn: 'Sign in',
    register: 'Create account',
    toRegister: "Don't have an account?",
    toLogin: 'Already have an account?',
    registerLink: 'Register',
    loginLink: 'Sign in',
    submitting: 'Please wait…'
  },
  zh: {
    loginTitle: '登录通微宝账户',
    registerTitle: '注册通微宝账户',
    loginSub: '登录后可追踪订单、管理收货地址、快速结算。',
    registerSub: '注册账户即可查看订单、保存地址、享受更快结算。',
    email: '邮箱',
    password: '密码',
    name: '姓名',
    phone: '手机（可选）',
    country: '国家/地区（可选）',
    signIn: '登录',
    register: '注册账户',
    toRegister: '还没有账户？',
    toLogin: '已有账户？',
    registerLink: '立即注册',
    loginLink: '前往登录',
    submitting: '请稍候…'
  },
  'zh-tw': {
    loginTitle: '登入通微寶帳戶',
    registerTitle: '註冊通微寶帳戶',
    loginSub: '登入後即可追蹤訂單、管理收件地址、快速結算。',
    registerSub: '註冊帳戶即可檢視訂單、儲存地址、享更快結算。',
    email: '電子郵件',
    password: '密碼',
    name: '姓名',
    phone: '手機（選填）',
    country: '國家/地區（選填）',
    signIn: '登入',
    register: '建立帳戶',
    toRegister: '尚未擁有帳戶？',
    toLogin: '已有帳戶？',
    registerLink: '立即註冊',
    loginLink: '前往登入',
    submitting: '請稍候…'
  }
} as const;

export default function AuthModal({ currentLang, isOpen, initialMode = 'login', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = COPY[currentLang];

  const reset = () => {
    setEmail(''); setPassword(''); setName(''); setPhone(''); setCountry(''); setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await customerLogin(email, password);
      } else {
        await registerCustomer({ name, email, password, phone, country });
      }
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative z-10 bg-[#0a0f1d] text-white w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-[#04060d]">
              {mode === 'login' ? <LogIn className="w-4.5 h-4.5" /> : <UserPlus className="w-4.5 h-4.5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">
                {mode === 'login' ? t.loginTitle : t.registerTitle}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                {mode === 'login' ? t.loginSub : t.registerSub}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3.5">
          {mode === 'register' && (
            <Field icon={<User className="w-4 h-4" />} label={t.name}>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
                placeholder={currentLang === 'en' ? 'Jane Doe' : '请输入姓名'}
              />
            </Field>
          )}
          <Field icon={<Mail className="w-4 h-4" />} label={t.email}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </Field>
          <Field icon={<Lock className="w-4 h-4" />} label={t.password}>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
              placeholder={mode === 'register' ? (currentLang === 'en' ? '6+ characters' : '至少 6 位') : '••••••'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </Field>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Field icon={<Phone className="w-4 h-4" />} label={t.phone}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  placeholder="+86 138…"
                />
              </Field>
              <Field icon={<Globe2 className="w-4 h-4" />} label={t.country}>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  placeholder={currentLang === 'en' ? 'United States' : '中国'}
                />
              </Field>
            </div>
          )}

          {error && (
            <p className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 disabled:opacity-60 text-[#04060d] font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all cursor-pointer hover:brightness-110"
            style={{ background: 'linear-gradient(120deg, #BAE6FD, #38BDF8 55%, #22D3EE)' }}
          >
            {busy ? t.submitting : (mode === 'login' ? t.signIn : t.register)}
          </button>

          <p className="text-xs text-center text-slate-400 font-bold">
            {mode === 'login' ? t.toRegister : t.toLogin}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
            >
              {mode === 'login' ? t.registerLink : t.loginLink}
            </button>
          </p>

          <p className="text-[10px] text-center text-slate-400 font-bold flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3 h-3" />
            {currentLang === 'en'
              ? 'Secure session — passwords are hashed with bcrypt on the server.'
              : '安全登录 — 密码经 bcrypt 加盐哈希存储于服务器。'}
          </p>
        </form>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
      <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 focus-within:border-cyan-400 transition-colors">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}
