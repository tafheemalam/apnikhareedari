import { createContext, useContext, useEffect, useState } from 'react';
import * as catalogService from '../services/catalogService';
import * as basketService from '../services/basketService';

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
  // The "Baskets" nav entry should only appear once a customer could actually do
  // something with it — at least one active basket to fill, and at least one
  // in-stock, basket-eligible product to put in it.
  const [hasBasketOption, setHasBasketOption] = useState(false);

  useEffect(() => {
    Promise.all([catalogService.getCategories(), catalogService.getPublicSettings()])
      .then(([cats, publicSettings]) => {
        setCategories(cats);
        setSettings({ ...FALLBACK_SETTINGS, ...publicSettings });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      basketService.getActiveBaskets(),
      catalogService.getProducts({ show_in_basket: true, availability: 'in_stock', per_page: 1 }),
    ])
      .then(([baskets, products]) => setHasBasketOption(baskets.length > 0 && products.total > 0))
      .catch(() => {});
  }, []);

  return (
    <SiteContext.Provider value={{ categories, settings, loading, hasBasketOption }}>{children}</SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
