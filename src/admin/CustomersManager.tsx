import { useEffect, useMemo, useState } from 'react';
import {
  Search, Mail, Download, ShieldOff, ShieldCheck, KeyRound, Trash2,
  Eye, X, Phone, Globe2, Calendar, BadgeCheck
} from 'lucide-react';
import {
  adminResetCustomerPassword, deleteCustomerAccount, downloadCsv,
  listCustomerAccounts, listCustomers, listOrdersForCustomer, refreshCustomerAccounts,
  refreshOrders, setCustomerStatus, subscribe
} from './store';
import { CustomerAccount, CustomerRecord, Order, OrderStatus } from './types';

const STATUS_TAG: Record<OrderStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  paid:      'bg-sky-50 text-sky-700 border-sky-200',
  shipped:   'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待支付', paid: '已支付', shipped: '已发货', completed: '已完成', cancelled: '已取消'
};

type Tab = 'registered' | 'aggregated';

export default function CustomersManager() {
  const [tab, setTab] = useState<Tab>('registered');
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<CustomerAccount[]>(listCustomerAccounts());
  const [aggregated, setAggregated] = useState<CustomerRecord[]>(listCustomers());
  const [viewing, setViewing] = useState<CustomerAccount | null>(null);

  useEffect(() => {
    const sync = () => {
      setAccounts(listCustomerAccounts());
      setAggregated(listCustomers());
    };
    // Initial fetch (in case caches are stale) + subscribe for live changes
    Promise.all([refreshCustomerAccounts(), refreshOrders()]).then(sync);
    return subscribe(sync);
  }, []);

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const filteredAggregated = useMemo(() => {
    if (!search.trim()) return aggregated;
    const q = search.toLowerCase();
    return aggregated.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
    );
  }, [aggregated, search]);

  const exportCsv = () => {
    if (tab === 'registered') {
      const head = ['客户ID', '姓名', '邮箱', '电话', '国家', '状态', '地址数', '注册时间', '最近登录'];
      const rows = filteredAccounts.map((c) => [c.id, c.name, c.email, c.phone || '', c.country || '', c.status, c.addresses.length, c.createdAt, c.lastLoginAt || '']);
      const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`therabo-accounts-${stamp}.csv`, csv);
    } else {
      const head = ['姓名', '邮箱', '国家/地区', '订单数', 'CNY 累计', 'USD 累计', '最近下单', '是否注册账户'];
      const rows = filteredAggregated.map((c) => [c.name, c.email, c.country, c.orders, c.totalSpentCNY, c.totalSpentUSD, c.lastOrderAt, c.registered ? '是' : '否']);
      const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`therabo-customers-${stamp}.csv`, csv);
    }
  };

  const handleToggleStatus = async (c: CustomerAccount) => {
    const next: 'active' | 'disabled' = c.status === 'active' ? 'disabled' : 'active';
    const msg = next === 'disabled' ? `确认停用账户 ${c.email}？停用后该客户无法登录。` : `确认重新启用账户 ${c.email}？`;
    if (!confirm(msg)) return;
    try { await setCustomerStatus(c.id, next); } catch (err) { alert(err instanceof Error ? err.message : '操作失败'); }
  };

  const handleResetPassword = async (c: CustomerAccount) => {
    const pwd = prompt(`为 ${c.email} 设置新密码（至少 6 位）：`, '');
    if (!pwd) return;
    try {
      await adminResetCustomerPassword(c.id, pwd);
      alert('密码已重置。请通过安全渠道告知客户。');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (c: CustomerAccount) => {
    if (!confirm(`确认删除账户 ${c.email}？此操作不可撤销，但历史订单仍会保留。`)) return;
    try {
      await deleteCustomerAccount(c.id);
      if (viewing && viewing.id === c.id) setViewing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">客户管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            注册账户 {accounts.length} 位 · 含访客共出现 {aggregated.length} 位客户
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" />
          导出 CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1">
          {(['registered', 'aggregated'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors cursor-pointer ${
                tab === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'registered' ? `注册账户 (${accounts.length})` : `订单聚合 (${aggregated.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名 / 邮箱 / 国家 / 客户ID…"
            className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
        </div>
      </div>

      {tab === 'registered' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left  px-5 py-3">客户</th>
                <th className="text-left  px-5 py-3">客户 ID</th>
                <th className="text-left  px-5 py-3">国家</th>
                <th className="text-center px-5 py-3">状态</th>
                <th className="text-center px-5 py-3">地址</th>
                <th className="text-right px-5 py-3">注册时间</th>
                <th className="text-right px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400 font-bold">尚无注册客户。访客在前台点击「登录 / 注册」即可创建账户。</td></tr>
              )}
              {filteredAccounts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-extrabold text-slate-900">{c.name}</p>
                    <a href={`mailto:${c.email}`} className="text-[11px] text-sky-600 font-bold flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" />
                      {c.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono font-black text-slate-700">{c.id}</td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-600">{c.country || '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${
                      c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {c.status === 'active' ? <BadgeCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {c.status === 'active' ? '活跃' : '已停用'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-xs font-mono font-bold text-slate-600">{c.addresses.length}</td>
                  <td className="px-5 py-3 text-right text-xs font-bold text-slate-500">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(c)} title="查看详情与订单" className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(c)} title="重置密码" className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(c)} title={c.status === 'active' ? '停用账户' : '启用账户'} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded cursor-pointer">
                        {c.status === 'active' ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(c)} title="删除账户" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left  px-5 py-3">客户</th>
                <th className="text-left  px-5 py-3">国家/地区</th>
                <th className="text-center px-5 py-3">类型</th>
                <th className="text-center px-5 py-3">订单数</th>
                <th className="text-right px-5 py-3">累计 (CNY)</th>
                <th className="text-right px-5 py-3">累计 (USD)</th>
                <th className="text-right px-5 py-3">最近活动</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAggregated.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400 font-bold">尚无客户数据</td></tr>
              )}
              {filteredAggregated.map((c) => (
                <tr key={`${c.email}-${c.customerId || 'guest'}`} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-extrabold text-slate-900">{c.name}</p>
                    <a href={`mailto:${c.email}`} className="text-[11px] text-sky-600 font-bold flex items-center gap-1 hover:underline">
                      <Mail className="w-3 h-3" />
                      {c.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-slate-600">{c.country}</td>
                  <td className="px-5 py-3 text-center">
                    {c.registered ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">注册</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full bg-slate-100 text-slate-500 border border-slate-200">访客</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center font-mono font-black text-slate-900">{c.orders}</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">¥{c.totalSpentCNY.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-emerald-600">${c.totalSpentUSD.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-xs font-bold text-slate-500">{new Date(c.lastOrderAt).toLocaleDateString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <AccountDrawer
          account={viewing}
          onClose={() => setViewing(null)}
          onChanged={() => setAccounts(listCustomerAccounts())}
        />
      )}
    </div>
  );
}

function AccountDrawer({ account, onClose, onChanged }:
  { account: CustomerAccount; onClose: () => void; onChanged: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { listOrdersForCustomer(account.id).then(setOrders); }, [account.id]);

  const toggle = async () => {
    const next: 'active' | 'disabled' = account.status === 'active' ? 'disabled' : 'active';
    try { await setCustomerStatus(account.id, next); onChanged(); } catch (err) { alert(err instanceof Error ? err.message : '操作失败'); }
  };

  const reset = async () => {
    const pwd = prompt(`为 ${account.email} 设置新密码（至少 6 位）：`, '');
    if (!pwd) return;
    try {
      await adminResetCustomerPassword(account.id, pwd);
      alert('密码已重置。');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">客户详情</p>
            <p className="font-extrabold text-slate-900">{account.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm font-bold text-slate-700">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {account.email}</div>
            {account.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {account.phone}</div>}
            {account.country && <div className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-slate-400" /> {account.country}</div>}
            <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" /> 注册于 {new Date(account.createdAt).toLocaleString('zh-CN')}</div>
            {account.lastLoginAt && <div className="text-[11px] text-slate-400">最近登录：{new Date(account.lastLoginAt).toLocaleString('zh-CN')}</div>}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={toggle} className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              account.status === 'active'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}>
              {account.status === 'active' ? <><ShieldOff className="w-3.5 h-3.5" />停用账户</> : <><ShieldCheck className="w-3.5 h-3.5" />启用账户</>}
            </button>
            <button onClick={reset} className="text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 cursor-pointer">
              <KeyRound className="w-3.5 h-3.5" />重置密码
            </button>
          </div>

          <div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">收货地址 ({account.addresses.length})</h3>
            {account.addresses.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">客户尚未保存任何收货地址</p>
            ) : (
              <div className="space-y-2">
                {account.addresses.map((a) => (
                  <div key={a.id} className="border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700">
                    <p className="font-extrabold text-slate-900">{a.label}{a.isDefault && <span className="ml-2 text-[9px] font-black text-rose-600">默认</span>}</p>
                    <p>{a.recipient} · {a.phone}</p>
                    <p className="text-slate-500">{a.country} {a.address}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">订单 ({orders.length})</h3>
            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold">该客户尚无订单</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-mono text-xs font-black text-slate-900">{o.id}</p>
                      <p className="text-[11px] text-slate-500 font-bold">{new Date(o.createdAt).toLocaleString('zh-CN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${STATUS_TAG[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {o.currency === 'CNY' ? '¥' : '$'}{o.subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
