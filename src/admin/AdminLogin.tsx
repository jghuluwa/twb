import { useState, FormEvent } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { authenticate } from './store';

interface Props {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: Props) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authenticate(username.trim(), password);
      if (user) onSuccess();
      else setError('用户名或密码错误');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Therabo 管理后台</h1>
          <p className="text-xs font-bold text-slate-500 mt-1 tracking-widest uppercase">Admin Console</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              用户名
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              密码
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-2 rounded-lg text-xs font-bold border border-rose-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-sm py-3 rounded-xl shadow-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? '验证中…' : '登录'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-bold">
            首次登录请使用部署时设置的管理员账号
          </p>
          <button
            onClick={() => { window.location.hash = ''; window.location.reload(); }}
            className="mt-3 text-[11px] text-slate-400 hover:text-slate-600 underline"
          >
            返回前台主站
          </button>
        </div>
      </div>
    </div>
  );
}
