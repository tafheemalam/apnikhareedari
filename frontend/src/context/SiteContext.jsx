import { createContext, useContext, useEffect, useState } from 'react';
import * as catalogService from '../services/catalogService';

const SiteContext = createContext(null);

const FALLBACK_SETTINGS = {
  'store.name': 'ApniKhareedari',
  'store.email': '',
  'store.phone': '',
  'store.address': '',
  'payment.cod_enabled': '1',
  'payment.online_enabled': '1',
};

export function SiteProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([catalogService.getCategories(), catalogService.getPublicSettings()])
      .then(([cats, publicSettings]) => {
        setCategories(cats);
        setSettings({ ...FALLBACK_SETTINGS, ...publicSettings });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteContext.Provider value={{ categories, settings, loading }}>{children}</SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
