import { useEffect, useState } from 'react';
import { getCommerceConfig, subscribe, type CommerceConfig } from '../admin/store';

/**
 * Reactive accessor for the admin-controlled storefront commerce toggles
 * (whether shopping is enabled and whether prices are shown). Stays in sync
 * with the store cache, which is populated on app boot and refreshed whenever
 * an admin updates the settings.
 */
export function useCommerceConfig(): CommerceConfig {
  const [config, setConfig] = useState<CommerceConfig>(getCommerceConfig());

  useEffect(() => {
    const sync = () => setConfig(getCommerceConfig());
    sync();
    return subscribe(sync);
  }, []);

  return config;
}
