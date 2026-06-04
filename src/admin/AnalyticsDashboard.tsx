import { useEffect, useMemo, useState } from 'react';
import { Eye, MonitorSmartphone, MousePointer2, Users } from 'lucide-react';
import { fetchAnalyticsSummary, type AnalyticsSummary } from './store';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  useEffect(() => { fetchAnalyticsSummary().then(setData); }, []);
  const daily = useMemo(() => {
    const map = new Map(data?.daily.map((d) => [d.date, d]) || []);
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (13 - i));
      const key = date.toISOString().slice(0, 10);
      return map.get(key) || { date: key, views: 0, visitors: 0 };
    });
  }, [data]);
  const max = Math.max(1, ...daily.map((d) => d.views));
  if (!data) return <p className="text-sm text-slate-400">加载访问统计…</p>;
  return <div className="space-y-7">
    <div><h1 className="text-2xl font-extrabold text-slate-900">访问量统计</h1><p className="mt-1 text-sm text-slate-500">隐私友好的网站访问趋势，不保存原始 IP</p></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card icon={Eye} label="累计浏览量" value={data.totals.views} />
      <Card icon={Users} label="累计独立访客" value={data.totals.visitors} />
      <Card icon={MousePointer2} label="今日浏览量" value={data.totals.viewsToday} />
      <Card icon={MonitorSmartphone} label="今日独立访客" value={data.totals.visitorsToday} />
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-extrabold text-slate-900">近 14 天访问趋势</h2><div className="mt-6 flex h-52 items-end gap-2">{daily.map((d) => <div key={d.date} className="flex flex-1 flex-col items-center gap-2"><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t bg-gradient-to-t from-rose-600 to-cyan-400" style={{ height: `${Math.max(3, d.views / max * 100)}%` }} title={`${d.views} views`} /></div><span className="text-[8px] font-mono text-slate-400">{d.date.slice(5)}</span></div>)}</div></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <List title="热门页面" items={data.topPages.map((x) => [x.path, x.views])} />
      <List title="设备分布" items={data.devices.map((x) => [x.device, x.views])} />
    </div>
  </div>;
}
function Card({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-rose-600" /><p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-mono text-2xl font-black text-slate-900">{value.toLocaleString()}</p></div>; }
function List({ title, items }: { title: string; items: [string, number][] }) { return <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-extrabold text-slate-900">{title}</h2><div className="mt-4 space-y-3">{items.map(([label, value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-2 text-sm"><span className="font-bold text-slate-600">{label}</span><strong className="font-mono">{value}</strong></div>)}</div></div>; }
