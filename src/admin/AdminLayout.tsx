import { ReactNode } from 'react';
import {
  LayoutDashboard, Package, ClipboardList, Users, FileEdit,
  LogOut, ExternalLink, Settings2, Megaphone, Tag, Mail, Truck,
  MessageSquare, FileText, Sliders, History, BoxIcon, BarChart3, Handshake
} from 'lucide-react';
import { currentSession, logout } from './store';

export type AdminView =
  | 'dashboard' | 'products' | 'inventory' | 'orders' | 'customers'
  | 'content' | 'promotions' | 'discounts' | 'emails' | 'subscribers'
  | 'shipping' | 'reviews' | 'pages' | 'settings' | 'audit' | 'users' | 'analytics' | 'inquiries';

interface Props {
  view: AdminView;
  onChangeView: (v: AdminView) => void;
  children: ReactNode;
}

interface NavGroup { label: string; items: { id: AdminView; label: string; icon: typeof Package }[] }

const navGroups: NavGroup[] = [
  { label: '概览', items: [
    { id: 'dashboard', label: '数据看板', icon: LayoutDashboard },
    { id: 'analytics', label: '访问量统计', icon: BarChart3 }
  ]},
  { label: '商品 & 订单', items: [
    { id: 'products',  label: '产品管理', icon: Package },
    { id: 'inventory', label: '库存监控', icon: BoxIcon },
    { id: 'orders',    label: '订单管理', icon: ClipboardList },
    { id: 'customers', label: '客户列表', icon: Users },
    { id: 'reviews',   label: '评价审核', icon: MessageSquare }
  ]},
  { label: '营销', items: [
    { id: 'promotions',  label: '弹窗 / 顶栏', icon: Megaphone },
    { id: 'discounts',   label: '优惠码',     icon: Tag },
    { id: 'emails',      label: '邮件中心',   icon: Mail },
    { id: 'subscribers', label: '订阅者',     icon: Users }
  ]},
  { label: '内容 & 运营', items: [
    { id: 'inquiries', label: '合作咨询', icon: Handshake },
    { id: 'content',  label: '首页内容', icon: FileEdit },
    { id: 'pages',    label: 'CMS 页面', icon: FileText },
    { id: 'shipping', label: '运费规则', icon: Truck }
  ]},
  { label: '系统', items: [
    { id: 'settings', label: '站点设置', icon: Sliders },
    { id: 'users',    label: '管理员账号', icon: Settings2 },
    { id: 'audit',    label: '审计日志', icon: History }
  ]}
];

export default function AdminLayout({ view, onChangeView, children }: Props) {
  const session = currentSession();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden w-60 bg-slate-900 text-white lg:flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-black text-lg">T</div>
            <div>
              <p className="font-extrabold text-base leading-tight">Therabo</p>
              <p className="text-[10px] font-bold tracking-widest text-slate-400">ADMIN CONSOLE</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-4 overflow-y-auto">
          {navGroups.map((g) => (
            <div key={g.label}>
              <p className="px-3 mb-1.5 text-[9px] font-black tracking-widest text-slate-500 uppercase">{g.label}</p>
              <div className="space-y-1">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.id;
                  return (
                    <button key={item.id} onClick={() => onChangeView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        active ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}>
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>访问前台主站</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出登录 ({session?.username})</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-60">
        <div className="border-b border-slate-200 bg-white p-3 lg:hidden">
          <select value={view} onChange={(e) => onChangeView(e.target.value as AdminView)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold">
            {navGroups.flatMap((g) => g.items).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
