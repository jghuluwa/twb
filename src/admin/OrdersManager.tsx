import { useEffect, useState, useMemo, ReactNode } from 'react';
import { Download, Search, Eye, Trash2, X, CheckCircle2, Truck, Clock, XCircle, Receipt } from 'lucide-react';
import { Order, OrderStatus } from './types';
import { listOrders, refreshOrders, updateOrderStatus, deleteOrder, exportOrdersAsCsv, downloadCsv, subscribe } from './store';

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending:   { label: '待支付', color: 'bg-amber-50  text-amber-700  border-amber-200',   icon: Clock },
  paid:      { label: '已支付', color: 'bg-sky-50    text-sky-700    border-sky-200',     icon: Receipt },
  shipped:   { label: '已发货', color: 'bg-violet-50 text-violet-700 border-violet-200',  icon: Truck },
  completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600  border-slate-200',   icon: XCircle }
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>(listOrders());
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [viewing, setViewing] = useState<Order | null>(null);

  useEffect(() => {
    refreshOrders().then(setOrders);
    return subscribe(() => setOrders(listOrders()));
  }, []);
  const refresh = async () => setOrders(await refreshOrders());

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
    });
  }, [orders, search, status]);

  const handleExport = () => {
    const csv = exportOrdersAsCsv(filtered);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`therabo-orders-${stamp}.csv`, csv);
  };

  const handleStatusChange = async (id: string, s: OrderStatus) => {
    try {
      await updateOrderStatus(id, s);
      await refresh();
      if (viewing && viewing.id === id) setViewing({ ...viewing, status: s });
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`确认删除订单 ${id} ？`)) return;
    try {
      await deleteOrder(id);
      await refresh();
      if (viewing && viewing.id === id) setViewing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const totals = useMemo(() => {
    const cny = filtered.filter((o) => o.currency === 'CNY').reduce((a, o) => a + o.subtotal, 0);
    const usd = filtered.filter((o) => o.currency === 'USD').reduce((a, o) => a + o.subtotal, 0);
    return { cny, usd, count: filtered.length };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">订单管理</h1>
          <p className="text-sm text-slate-500 mt-1">
            当前筛选 {totals.count} 单 · ¥{totals.cny.toLocaleString()} + ${totals.usd.toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>导出 CSV</span>
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
            placeholder="搜索订单号 / 客户名 / 邮箱…"
            className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1 overflow-x-auto">
          {(['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-xs font-bold py-1.5 px-3 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'all' ? '全部' : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">订单号</th>
              <th className="text-left px-5 py-3">下单时间</th>
              <th className="text-left px-5 py-3">客户</th>
              <th className="text-center px-5 py-3">商品</th>
              <th className="text-right px-5 py-3">金额</th>
              <th className="text-center px-5 py-3">状态</th>
              <th className="text-right px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-10 text-center text-sm text-slate-400 font-bold">暂无订单。前台完成结算后会自动出现在这里。</td></tr>
            )}
            {filtered.map((o) => {
              const meta = STATUS_META[o.status];
              const Icon = meta.icon;
              return (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs font-black text-slate-900">{o.id}</td>
                  <td className="px-5 py-3 text-xs font-bold text-slate-600">{new Date(o.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-5 py-3">
                    <p className="font-extrabold text-slate-900">{o.customer.name}</p>
                    <p className="text-[11px] text-slate-500 font-bold">{o.customer.email}</p>
                  </td>
                  <td className="px-5 py-3 text-center text-xs font-mono font-bold text-slate-600">
                    {o.items.reduce((a, it) => a + it.quantity, 0)} 件
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-black text-slate-900">
                    {o.currency === 'CNY' ? '¥' : '$'}{o.subtotal.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${meta.color}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewing(o)} title="查看详情" className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(o.id)} title="删除" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewing && <OrderDetail order={viewing} onClose={() => setViewing(null)} onChangeStatus={(s) => handleStatusChange(viewing.id, s)} />}
    </div>
  );
}

function OrderDetail({
  order, onClose, onChangeStatus
}: {
  order: Order;
  onClose: () => void;
  onChangeStatus: (s: OrderStatus) => void;
}) {
  const sym = order.currency === 'CNY' ? '¥' : '$';
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">订单详情</p>
            <p className="font-mono font-black text-slate-900">{order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="订单状态">
            <div className="flex flex-wrap gap-2">
              {(['pending', 'paid', 'shipped', 'completed', 'cancelled'] as OrderStatus[]).map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta.icon;
                const active = order.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onChangeStatus(s)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border transition-colors cursor-pointer ${
                      active ? 'bg-slate-900 text-white border-slate-900' : `${meta.color} hover:opacity-80`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="客户信息">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info label="姓名"  value={order.customer.name} />
              <Info label="邮箱"  value={order.customer.email} />
              <Info label="电话"  value={order.customer.phone || '—'} />
              <Info label="国家"  value={order.customer.country} />
              <Info label="地址"  value={order.customer.address || '—'} full />
            </dl>
          </Section>

          <Section title={`商品 (${order.items.length})`}>
            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <span
                    className="w-10 h-10 rounded-lg shrink-0 border border-slate-200"
                    style={{ backgroundColor: it.selectedColorHex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{it.productName}</p>
                    <p className="text-[11px] text-slate-500 font-bold">
                      {it.selectedColorName} · {it.selectedSize} · x{it.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm self-center">
                    {sym}{(it.unitPrice * it.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="合计">
            <div className="flex items-center justify-between bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <span className="text-sm font-bold text-rose-700">订单金额</span>
              <span className="font-mono text-xl font-black text-rose-700">{sym}{order.subtotal.toLocaleString()}</span>
            </div>
          </Section>

          {order.note && (
            <Section title="备注">
              <p className="text-sm text-slate-600 leading-relaxed">{order.note}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm font-bold text-slate-800 mt-0.5 break-all">{value}</dd>
    </div>
  );
}
