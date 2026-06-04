import { useEffect, useMemo, useState } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingUp, Users } from 'lucide-react';
import {
  listOrders, listProducts, listCustomers,
  refreshOrders, refreshProducts, refreshCustomerAccounts, subscribe
} from './store';

export default function Dashboard() {
  const [, setTick] = useState(0);
  useEffect(() => {
    Promise.all([refreshOrders(), refreshProducts(), refreshCustomerAccounts()])
      .then(() => setTick((t) => t + 1));
    return subscribe(() => setTick((t) => t + 1));
  }, []);
  const orders = listOrders();
  const products = listProducts();
  const customers = listCustomers();

  const stats = useMemo(() => {
    const totalCNY = orders.filter((o) => o.currency === 'CNY').reduce((acc, o) => acc + o.subtotal, 0);
    const totalUSD = orders.filter((o) => o.currency === 'USD').reduce((acc, o) => acc + o.subtotal, 0);
    const last30 = orders.filter((o) => Date.now() - new Date(o.createdAt).getTime() < 30 * 86400_000);
    return {
      totalCNY,
      totalUSD,
      orderCount: orders.length,
      productCount: products.length,
      customerCount: customers.length,
      last30Count: last30.length
    };
  }, [orders, products, customers]);

  // Sales by day (last 14 days)
  const dailySeries = useMemo(() => {
    const buckets: { date: string; label: string; cny: number; usd: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      buckets.push({ date: key, label, cny: 0, usd: 0, count: 0 });
    }
    for (const o of orders) {
      const key = o.createdAt.slice(0, 10);
      const bucket = buckets.find((b) => b.date === key);
      if (!bucket) continue;
      bucket.count += 1;
      if (o.currency === 'CNY') bucket.cny += o.subtotal;
      else bucket.usd += o.subtotal;
    }
    return buckets;
  }, [orders]);

  const maxDaily = Math.max(1, ...dailySeries.map((b) => b.cny + b.usd * 7));

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenueCNY: number; revenueUSD: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cur = map.get(it.productId) || { name: it.productName, quantity: 0, revenueCNY: 0, revenueUSD: 0 };
        cur.quantity += it.quantity;
        if (o.currency === 'CNY') cur.revenueCNY += it.unitPrice * it.quantity;
        else cur.revenueUSD += it.unitPrice * it.quantity;
        map.set(it.productId, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">数据看板</h1>
        <p className="text-sm text-slate-500 mt-1">实时业务概览 · 最近30天有 {stats.last30Count} 笔订单</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard icon={DollarSign} color="rose"    label="销售额 (CNY)" value={`¥${stats.totalCNY.toLocaleString()}`} />
        <KpiCard icon={DollarSign} color="emerald" label="销售额 (USD)" value={`$${stats.totalUSD.toLocaleString()}`} />
        <KpiCard icon={ShoppingBag} color="sky"    label="订单总数"     value={stats.orderCount.toString()} />
        <KpiCard icon={Users}      color="violet"  label="累计客户"     value={stats.customerCount.toString()} />
      </div>

      {/* Sales chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">近 14 天销售额</h2>
            <p className="text-xs text-slate-500 mt-0.5">USD 已按 7 倍折算并加在 CNY 上方便观察</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500" />CNY</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />USD</span>
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {dailySeries.map((b) => {
            const totalForScale = b.cny + b.usd * 7;
            const heightPct = totalForScale === 0 ? 4 : (totalForScale / maxDaily) * 100;
            const cnyShare = totalForScale > 0 ? (b.cny / totalForScale) * heightPct : 0;
            const usdShare = totalForScale > 0 ? (b.usd * 7 / totalForScale) * heightPct : 0;
            return (
              <div key={b.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full flex-1 flex flex-col justify-end relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity">
                    {b.count}单
                  </div>
                  <div style={{ height: `${usdShare}%` }} className="w-full bg-emerald-500 rounded-t" />
                  <div style={{ height: `${cnyShare}%` }} className="w-full bg-rose-500" />
                  {totalForScale === 0 && <div className="w-full h-1 bg-slate-100 rounded" />}
                </div>
                <span className="text-[9px] font-mono text-slate-400">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top products + Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-600" />
            热销 Top 5
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center font-bold">暂无销售数据</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-bold">售出 {p.quantity} 件</p>
                  </div>
                  <div className="text-right text-xs font-mono font-bold text-slate-700">
                    {p.revenueCNY > 0 && <div>¥{p.revenueCNY.toLocaleString()}</div>}
                    {p.revenueUSD > 0 && <div className="text-emerald-600">${p.revenueUSD.toLocaleString()}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-rose-600" />
            库存概览
          </h2>
          <div className="space-y-3">
            <Row label="在售产品" value={stats.productCount.toString()} />
            <Row label="护具系列" value={products.filter((p) => p.category === 'protective').length.toString()} />
            <Row label="内衣系列" value={products.filter((p) => p.category === 'underwear').length.toString()} />
            <Row label="专用系列" value={products.filter((p) => p.category === 'special').length.toString()} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon, color, label, value
}: {
  icon: typeof Package;
  color: 'rose' | 'emerald' | 'sky' | 'violet';
  label: string;
  value: string;
}) {
  const colorMap = {
    rose:    'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky:     'bg-sky-50 text-sky-600',
    violet:  'bg-violet-50 text-violet-600'
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="font-mono text-2xl font-black text-slate-900 mt-3">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <span className="font-mono text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
