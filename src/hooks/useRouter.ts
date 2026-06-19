import { useCallback, useEffect, useState } from 'react';
import { Route, parseRoute, buildPath, DEFAULT_LANG } from '../lib/router';

function readRoute(): Route {
  if (typeof window === 'undefined') return { lang: DEFAULT_LANG, view: 'home' };
  return parseRoute(window.location.pathname);
}

/**
 * Single source of truth for the current storefront route. Listens to the
 * browser history (back/forward) and exposes navigate helpers that push real
 * URLs. The bare "/" entry point is normalized to "/<lang>/" in place so the
 * URL always carries a language prefix without polluting history.
 */
export function useRouter() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const r = parseRoute(window.location.pathname);
    const canonical = buildPath(r);
    if (window.location.pathname !== canonical) {
      window.history.replaceState(
        window.history.state,
        '',
        canonical + window.location.search
      );
    }
    setRoute(r);
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: Route, opts?: { replace?: boolean }) => {
    const url = buildPath(next) + window.location.search;
    if (opts?.replace) {
      window.history.replaceState({ therabo: true }, '', url);
    } else {
      window.history.pushState({ therabo: true }, '', url);
    }
    setRoute(next);
  }, []);

  return { route, navigate };
}
