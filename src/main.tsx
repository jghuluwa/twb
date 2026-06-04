import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './admin/AdminApp.tsx';
import { initStore } from './admin/store.ts';
import './index.css';

/**
 * Route switch:
 *   #admin             → Admin console
 *   #admin/<view>      → Admin console at a specific sub-view
 *   (anything else)    → Public storefront
 */
function Root() {
  const isAdmin = () => window.location.hash.startsWith('#admin');
  const [admin, setAdmin] = useState<boolean>(isAdmin());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStore().finally(() => setReady(true));
    const handler = () => setAdmin(isAdmin());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFEFE]">
        <div className="text-sm font-bold text-slate-400">Loading…</div>
      </div>
    );
  }

  return admin ? <AdminApp /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
