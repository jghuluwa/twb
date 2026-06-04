import { useCallback, useEffect, useState } from 'react';

export type StorefrontView = 'home' | 'account';

function viewFromHash(): StorefrontView {
  if (typeof window === 'undefined') return 'home';
  return window.location.hash === '#account' ? 'account' : 'home';
}

export function useStorefrontView() {
  const [view, setView] = useState<StorefrontView>(viewFromHash);

  useEffect(() => {
    const syncView = () => {
      const hash = window.location.hash;
      if (hash === '#account') {
        setView('account');
      } else if (!hash.startsWith('#admin')) {
        setView('home');
      }
    };

    syncView();
    window.addEventListener('hashchange', syncView);
    return () => window.removeEventListener('hashchange', syncView);
  }, []);

  const goHome = useCallback(() => {
    if (window.location.hash === '#account') window.location.hash = '';
    setView('home');
  }, []);

  const goAccount = useCallback(() => {
    window.location.hash = 'account';
    setView('account');
  }, []);

  return {
    view,
    goHome,
    goAccount
  };
}
