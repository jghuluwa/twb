import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, UserPlus, X, AlertCircle } from 'lucide-react';
import { listUsers, refreshUsers, addUser, deleteUser } from './store';
import { AdminUserAccount } from './types';

export default function UsersManager() {
  const [users, setUsers] = useState<AdminUserAccount[]>(listUsers());
  const [adding, setAdding] = useState(false);

  useEffect(() => { refreshUsers().then(setUsers); }, []);
  const refresh = async () => setUsers(await refreshUsers());

  const handleDelete = async (username: string) => {
    if (!confirm(`确认删除账号 "${username}" ？`)) return;
    try {
      await deleteUser(username);
      await refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">管理员账号</h1>
          <p className="text-sm text-slate-500 mt-1">共 {users.length} 个账号</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          新增账号
        </button>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs font-bold text-sky-800 leading-relaxed">
          密码以 <code className="font-mono">bcrypt</code> 加盐哈希存储于服务器数据库。建议为每位运营人员单独建账号，
          离职或转岗后及时停用。<strong>admin</strong> 角色可管理产品/订单/账号；<strong>editor</strong> 仅可编辑内容与产品。
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">用户名</th>
              <th className="text-left px-5 py-3">角色</th>
              <th className="text-left px-5 py-3">创建时间</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.username} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-extrabold text-slate-900">{u.username}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full ${
                    u.role === 'admin' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-3 text-xs font-bold text-slate-500">{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end">
                    <button onClick={() => handleDelete(u.username)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && <AddUserModal onClose={() => setAdding(false)} onAdded={refresh} />}
    </div>
  );
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('editor');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || password.length < 8) {
      setError('用户名必填，密码至少 8 位');
      return;
    }
    try {
      await addUser({ username: username.trim(), password, role });
      onAdded();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-rose-600" />
            新增管理员账号
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="ip" required />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">密码（至少 8 位）</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ip" required />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">角色</label>
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'editor')} className="ip">
            <option value="admin">admin（全权）</option>
            <option value="editor">editor（编辑）</option>
          </select>
        </div>

        {error && <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">取消</button>
          <button type="submit" className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">添加</button>
        </div>

        <style>{`
          .ip { width:100%; padding:0.5rem 0.75rem; font-size:0.875rem; font-weight:600; color:rgb(15,23,42); background-color:rgb(248,250,252); border:1px solid rgb(226,232,240); border-radius:0.5rem; outline:none; }
          .ip:focus { border-color:rgb(244,114,182); }
        `}</style>
      </form>
    </div>
  );
}
