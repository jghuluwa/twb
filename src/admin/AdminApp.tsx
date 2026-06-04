import { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminLayout, { AdminView } from './AdminLayout';
import Dashboard from './Dashboard';
import ProductsManager from './ProductsManager';
import OrdersManager from './OrdersManager';
import CustomersManager from './CustomersManager';
import ContentEditor from './ContentEditor';
import UsersManager from './UsersManager';
import PromotionsManager from './PromotionsManager';
import DiscountsManager from './DiscountsManager';
import EmailsCenter from './EmailsCenter';
import SubscribersManager from './SubscribersManager';
import ShippingManager from './ShippingManager';
import ReviewsManager from './ReviewsManager';
import PagesManager from './PagesManager';
import SettingsManager from './SettingsManager';
import AuditViewer from './AuditViewer';
import InventoryView from './InventoryView';
import AnalyticsDashboard from './AnalyticsDashboard';
import ContactInquiriesManager from './ContactInquiriesManager';
import { currentSession } from './store';

const ALL_VIEWS: AdminView[] = [
  'dashboard', 'products', 'inventory', 'orders', 'customers',
  'content', 'promotions', 'discounts', 'emails', 'subscribers',
  'shipping', 'reviews', 'pages', 'settings', 'audit', 'users', 'analytics', 'inquiries'
];

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean>(!!currentSession());
  const [view, setView] = useState<AdminView>('dashboard');

  useEffect(() => {
    const sync = () => {
      const parts = window.location.hash.replace(/^#/, '').split('/');
      const sub = parts[1] as AdminView | undefined;
      if (sub && ALL_VIEWS.includes(sub)) setView(sub);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const changeView = (v: AdminView) => {
    setView(v);
    window.location.hash = `admin/${v}`;
  };

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  return (
    <AdminLayout view={view} onChangeView={changeView}>
      {view === 'dashboard'   && <Dashboard />}
      {view === 'analytics'   && <AnalyticsDashboard />}
      {view === 'inquiries'   && <ContactInquiriesManager />}
      {view === 'products'    && <ProductsManager />}
      {view === 'inventory'   && <InventoryView />}
      {view === 'orders'      && <OrdersManager />}
      {view === 'customers'   && <CustomersManager />}
      {view === 'reviews'     && <ReviewsManager />}
      {view === 'promotions'  && <PromotionsManager />}
      {view === 'discounts'   && <DiscountsManager />}
      {view === 'emails'      && <EmailsCenter />}
      {view === 'subscribers' && <SubscribersManager />}
      {view === 'content'     && <ContentEditor />}
      {view === 'pages'       && <PagesManager />}
      {view === 'shipping'    && <ShippingManager />}
      {view === 'settings'    && <SettingsManager />}
      {view === 'audit'       && <AuditViewer />}
      {view === 'users'       && <UsersManager />}
    </AdminLayout>
  );
}
