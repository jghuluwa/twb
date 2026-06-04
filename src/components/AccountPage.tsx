import { useEffect, useState, FormEvent, ReactNode } from 'react';
import {
  User, MapPin, ClipboardList, Lock, LogOut, Plus, Trash2, Pencil,
  CheckCircle2, ChevronLeft, Receipt, Truck, Clock, XCircle, Star
} from 'lucide-react';
import { Language } from '../types';
import {
  CustomerAccount, CustomerAddress, Order, OrderStatus
} from '../admin/types';
import {
  addCustomerAddress, changeCustomerPassword, currentCustomer, customerLogout,
  deleteCustomerAddress, fetchCustomerOrders, subscribeCustomerSession,
  updateCustomerAddress, updateCustomerProfile
} from '../admin/store';

interface AccountPageProps {
  currentLang: Language;
  currency: 'USD' | 'CNY';
  onBack: () => void;
  onRequireLogin: () => void;
}

type Tab = 'profile' | 'orders' | 'addresses' | 'password';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   '待支付',
  paid:      '已支付',
  shipped:   '已发货',
  completed: '已完成',
  cancelled: '已取消'
};
const STATUS_ICON: Record<OrderStatus, typeof Clock> = {
  pending: Clock, paid: Receipt, shipped: Truck, completed: CheckCircle2, cancelled: XCircle
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  paid:      'bg-sky-50 text-sky-700 border-sky-200',
  shipped:   'bg-violet-50 text-violet-700 border-violet-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function AccountPage({ currentLang, onBack, onRequireLogin }: AccountPageProps) {
  const [account, setAccount] = useState<CustomerAccount | null>(currentCustomer());
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    const off = subscribeCustomerSession(() => setAccount(currentCustomer()));
    return off;
  }, []);

  useEffect(() => {
    if (!account) onRequireLogin();
  }, [account, onRequireLogin]);

  if (!account) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900">
          {currentLang === 'en' ? 'Please sign in to view your account.' : '请先登录后查看账户'}
        </h2>
        <button onClick={onBack} className="mt-6 text-sm font-bold text-rose-600 hover:underline">
          ← {currentLang === 'en' ? 'Back to store' : '返回主站'}
        </button>
      </section>
    );
  }

  const handleLogout = async () => {
    await customerLogout();
    onBack();
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-rose-600 mb-6 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        {currentLang === 'en' ? 'Back to store' : '返回主站'}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-lg">
              {account.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 truncate">{account.name}</p>
              <p className="text-[11px] text-slate-500 font-bold truncate">{account.email}</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1">
            <TabLink active={tab === 'profile'}  onClick={() => setTab('profile')}  icon={User}          label={currentLang === 'en' ? 'Profile'   : '个人资料'} />
            <TabLink active={tab === 'orders'}   onClick={() => setTab('orders')}   icon={ClipboardList} label={currentLang === 'en' ? 'Orders'    : '我的订单'} />
            <TabLink active={tab === 'addresses'} onClick={() => setTab('addresses')} icon={MapPin}      label={currentLang === 'en' ? 'Addresses' : '地址簿'} />
            <TabLink active={tab === 'password'} onClick={() => setTab('password')} icon={Lock}          label={currentLang === 'en' ? 'Password'  : '修改密码'} />
          </nav>
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-white hover:bg-rose-600 border border-slate-200 hover:border-rose-600 rounded-lg py-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            {currentLang === 'en' ? 'Sign out' : '退出登录'}
          </button>
        </aside>

        {/* Content */}
        <div>
          {tab === 'profile'   && <ProfileTab   account={account} currentLang={currentLang} onChange={setAccount} />}
          {tab === 'orders'    && <OrdersTab    account={account} currentLang={currentLang} />}
          {tab === 'addresses' && <AddressesTab account={account} currentLang={currentLang} onChange={setAccount} />}
          {tab === 'password'  && <PasswordTab  account={account} currentLang={currentLang} />}
        </div>
      </div>
    </section>
  );
}

function TabLink({ active, onClick, icon: Icon, label }:
  { active: boolean; onClick: () => void; icon: typeof User; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
        active ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ── Profile tab ──
function ProfileTab({ account, currentLang, onChange }:
  { account: CustomerAccount; currentLang: Language; onChange: (a: CustomerAccount) => void }) {
  const [name, setName]       = useState(account.name);
  const [phone, setPhone]     = useState(account.phone || '');
  const [country, setCountry] = useState(account.country || '');
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const next = await updateCustomerProfile(account.id, { name, phone, country });
      onChange(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <SectionCard title={currentLang === 'en' ? 'Profile' : '个人资料'} subtitle={currentLang === 'en' ? 'Manage how Therabo identifies you.' : '管理你的个人信息。'}>
      <form onSubmit={save} className="space-y-4 max-w-lg">
        <Labeled label={currentLang === 'en' ? 'Email (login)' : '邮箱（登录账号）'}>
          <input value={account.email} disabled className="w-full bg-slate-100 text-sm font-bold text-slate-500 px-3 py-2.5 rounded-lg border border-slate-200" />
        </Labeled>
        <Labeled label={currentLang === 'en' ? 'Full name' : '姓名'}>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-slate-50 text-sm font-bold text-slate-800 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-400" />
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label={currentLang === 'en' ? 'Phone' : '手机'}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 text-sm font-bold text-slate-800 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-400" />
          </Labeled>
          <Labeled label={currentLang === 'en' ? 'Country' : '国家/地区'}>
            <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-50 text-sm font-bold text-slate-800 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-400" />
          </Labeled>
        </div>
        {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer">
            {currentLang === 'en' ? 'Save changes' : '保存修改'}
          </button>
          {saved && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{currentLang === 'en' ? 'Saved' : '已保存'}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

// ── Orders tab ──
function OrdersTab({ account, currentLang }: { account: CustomerAccount; currentLang: Language }) {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { fetchCustomerOrders().then(setOrders).catch(() => setOrders([])); }, [account.id]);
  return (
    <SectionCard title={currentLang === 'en' ? 'My orders' : '我的订单'} subtitle={currentLang === 'en' ? `${orders.length} order(s) on file.` : `共 ${orders.length} 笔订单。`}>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-500 font-bold py-10 text-center">
          {currentLang === 'en' ? 'No orders yet — go grab something!' : '暂无订单，去逛逛吧！'}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const Icon = STATUS_ICON[o.status];
            const sym = o.currency === 'CNY' ? '¥' : '$';
            return (
              <div key={o.id} className="border border-slate-200 rounded-2xl p-4 hover:border-rose-200 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-mono text-xs font-black text-slate-900">{o.id}</p>
                    <p className="text-[11px] text-slate-500 font-bold">{new Date(o.createdAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${STATUS_COLOR[o.status]}`}>
                    <Icon className="w-3 h-3" />
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex justify-between text-slate-700 font-bold">
                      <span className="truncate pr-3">{it.productName} · {it.selectedColorName} / {it.selectedSize} × {it.quantity}</span>
                      <span className="font-mono text-slate-500">{sym}{(it.unitPrice * it.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm font-bold">
                  <span className="text-slate-500">{currentLang === 'en' ? 'Total' : '合计'}</span>
                  <span className="font-mono font-black text-slate-900">{sym}{o.subtotal.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ── Addresses tab ──
function AddressesTab({ account, currentLang, onChange }:
  { account: CustomerAccount; currentLang: Language; onChange: (a: CustomerAccount) => void }) {
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = () => {
    const next = currentCustomer();
    if (next) onChange(next);
  };

  const remove = async (id: string) => {
    if (!confirm(currentLang === 'en' ? 'Delete this address?' : '确认删除此地址？')) return;
    await deleteCustomerAddress(account.id, id);
    refresh();
  };

  const setDefault = async (id: string) => {
    await updateCustomerAddress(account.id, id, { isDefault: true });
    refresh();
  };

  return (
    <SectionCard
      title={currentLang === 'en' ? 'Address book' : '地址簿'}
      subtitle={currentLang === 'en' ? 'Saved shipping addresses speed up checkout.' : '保存的收货地址将在结算时自动填入。'}
      action={
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {currentLang === 'en' ? 'Add address' : '新增地址'}
        </button>
      }
    >
      {account.addresses.length === 0 && !showForm && (
        <p className="text-sm text-slate-500 font-bold py-10 text-center">
          {currentLang === 'en' ? 'No saved addresses yet.' : '暂未保存任何地址。'}
        </p>
      )}

      <div className="space-y-3">
        {account.addresses.map((a) => (
          <div key={a.id} className="border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-extrabold text-slate-900">{a.label}</p>
                {a.isDefault && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200"><Star className="w-3 h-3" />{currentLang === 'en' ? 'Default' : '默认'}</span>}
              </div>
              <p className="text-sm font-bold text-slate-700 mt-1">{a.recipient} · {a.phone}</p>
              <p className="text-xs text-slate-500 font-bold mt-0.5">{a.country} {a.address}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)} title={currentLang === 'en' ? 'Set as default' : '设为默认'} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer">
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => { setEditing(a); setShowForm(true); }} title={currentLang === 'en' ? 'Edit' : '编辑'} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded cursor-pointer">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(a.id)} title={currentLang === 'en' ? 'Delete' : '删除'} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <AddressForm
          customerId={account.id}
          currentLang={currentLang}
          initial={editing}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
        />
      )}
    </SectionCard>
  );
}

function AddressForm({ customerId, currentLang, initial, onCancel, onSaved }:
  { customerId: string; currentLang: Language; initial: CustomerAddress | null; onCancel: () => void; onSaved: () => void }) {
  const [label, setLabel]         = useState(initial?.label || (currentLang === 'en' ? 'Home' : '家'));
  const [recipient, setRecipient] = useState(initial?.recipient || '');
  const [phone, setPhone]         = useState(initial?.phone || '');
  const [country, setCountry]     = useState(initial?.country || (currentLang === 'en' ? 'United States' : '中国'));
  const [address, setAddress]     = useState(initial?.address || '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [error, setError]         = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (initial) {
        await updateCustomerAddress(customerId, initial.id, { label, recipient, phone, country, address, isDefault });
      } else {
        await addCustomerAddress(customerId, { label, recipient, phone, country, address, isDefault });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
      <div className="grid grid-cols-2 gap-3">
        <Labeled label={currentLang === 'en' ? 'Label' : '标签'}><input value={label} onChange={(e) => setLabel(e.target.value)} required className={inp} /></Labeled>
        <Labeled label={currentLang === 'en' ? 'Recipient' : '收件人'}><input value={recipient} onChange={(e) => setRecipient(e.target.value)} required className={inp} /></Labeled>
        <Labeled label={currentLang === 'en' ? 'Phone' : '电话'}><input value={phone} onChange={(e) => setPhone(e.target.value)} required className={inp} /></Labeled>
        <Labeled label={currentLang === 'en' ? 'Country' : '国家/地区'}><input value={country} onChange={(e) => setCountry(e.target.value)} required className={inp} /></Labeled>
      </div>
      <Labeled label={currentLang === 'en' ? 'Address' : '详细地址'}><textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className={inp + ' min-h-[60px]'} /></Labeled>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        {currentLang === 'en' ? 'Set as default address' : '设为默认地址'}
      </label>
      {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" className="bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer">
          {currentLang === 'en' ? 'Save' : '保存'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-2 cursor-pointer">
          {currentLang === 'en' ? 'Cancel' : '取消'}
        </button>
      </div>
    </form>
  );
}

// ── Password tab ──
function PasswordTab({ account, currentLang }: { account: CustomerAccount; currentLang: Language }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [done, setDone]     = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPwd !== confirm) {
      setError(currentLang === 'en' ? 'Passwords do not match.' : '两次输入的新密码不一致');
      return;
    }
    try {
      await changeCustomerPassword(account.id, oldPwd, newPwd);
      setDone(true);
      setOldPwd(''); setNewPwd(''); setConfirm('');
      setTimeout(() => setDone(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <SectionCard title={currentLang === 'en' ? 'Change password' : '修改密码'} subtitle={currentLang === 'en' ? 'Choose a new password with at least 6 characters.' : '新密码至少 6 位。'}>
      <form onSubmit={submit} className="space-y-3 max-w-md">
        <Labeled label={currentLang === 'en' ? 'Current password' : '当前密码'}>
          <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} required className={inp} />
        </Labeled>
        <Labeled label={currentLang === 'en' ? 'New password' : '新密码'}>
          <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} className={inp} />
        </Labeled>
        <Labeled label={currentLang === 'en' ? 'Confirm new password' : '确认新密码'}>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className={inp} />
        </Labeled>
        {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-slate-900 hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer">
            {currentLang === 'en' ? 'Update password' : '更新密码'}
          </button>
          {done && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{currentLang === 'en' ? 'Password updated' : '密码已更新'}</span>}
        </div>
      </form>
    </SectionCard>
  );
}

// ── Layout primitives ──
const inp = 'w-full bg-white text-sm font-bold text-slate-800 px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-400';

function SectionCard({ title, subtitle, action, children }:
  { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 font-bold mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">{label}</span>
      {children}
    </label>
  );
}
