import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Seo, { SITE_URL } from '../components/common/Seo';
import { useSite } from '../context/SiteContext';

const SOCIAL_KEYS = ['social.facebook', 'social.instagram', 'social.tiktok', 'social.youtube'];

const CATEGORY_ICONS = {
  'auto-bike': '🚗',
  'electronics': '🔌',
  'fashion': '👗',
  'home': '🏠',
  'kids-items': '🧸',
  'kitchen': '🍳',
  'medical': '💊',
  'personal-care': '🧴',
  'personalized-zone': '🎁',
};

function categoryIcon(cat) {
  return CATEGORY_ICONS[cat.slug] || '🛍️';
}

function categoryItemCount(cat) {
  const childCount = (cat.children || []).reduce((sum, child) => sum + (child.products_count || 0), 0);
  return (cat.products_count || 0) + childCount;
}

function ProductRow({ title, products, viewAllHref }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {viewAllHref && (
          <Link to={viewAllHref} className="text-sm font-semibold text-emerald-700 hover:underline">
            View all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { categories, settings } = useSite();
  const [state, setState] = useState({ featured: [], newArrivals: [], bestSellers: [], onSale: [], loading: true });
  const [banners, setBanners] = useState([]);
  const [bannersLoaded, setBannersLoaded] = useState(false);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'OnlineStore',
      name: 'ApniKhareedari',
      url: SITE_URL,
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      sameAs: SOCIAL_KEYS.map((key) => settings[key]).filter((url) => url && /^https?:\/\//i.test(url)),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ApniKhareedari',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  useEffect(() => {
    async function load() {
      try {
        const [featured, newArrivals, bestSellers, onSale] = await Promise.all([
          catalogService.getProducts({ featured: 1, per_page: 10 }),
          catalogService.getProducts({ new_arrival: 1, per_page: 10 }),
          catalogService.getProducts({ best_seller: 1, per_page: 10 }),
          catalogService.getProducts({ on_sale: 1, per_page: 10 }),
        ]);
        setState({
          featured: featured.data,
          newArrivals: newArrivals.data,
          bestSellers: bestSellers.data,
          onSale: onSale.data,
          loading: false,
        });
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    }
    load();
    catalogService
      .getBanners()
      .then(setBanners)
      .catch((err) => console.error('Failed to load homepage banners:', err))
      .finally(() => setBannersLoaded(true));
  }, []);

  return (
    <div>
      <Seo path="/" jsonLd={jsonLd} />
      {banners.length > 0 ? (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
          <HeroSlider banners={banners} />
        </div>
      ) : !bannersLoaded ? (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
          <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-100 sm:aspect-[2.5/1]" />
        </div>
      ) : (
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-16 sm:py-24">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              Pakistan's Trusted Online Store
            </span>
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight sm:text-5xl">
              Shop Everything You Need, Delivered to Your Door
            </h1>
            <p className="max-w-lg text-emerald-100">
              Electronics, fashion, home essentials and more — with Cash on Delivery available nationwide.
            </p>
            <Link
              to="/shop"
              className="mt-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="flex flex-col items-center rounded-2xl bg-amber-50/70 p-5 text-center transition-shadow hover:shadow-md"
              >
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-3xl shadow-sm sm:h-24 sm:w-24">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                  ) : (
                    categoryIcon(cat)
                  )}
                </div>
                <span className="mt-3 text-sm font-bold text-slate-900">{cat.name}</span>
                <span className="mt-0.5 text-xs text-slate-500">
                  {categoryItemCount(cat)} {categoryItemCount(cat) === 1 ? 'item' : 'items'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {state.loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <ProductRow title="Featured Products" products={state.featured} viewAllHref="/shop?featured=1" />
          <ProductRow title="New Arrivals" products={state.newArrivals} viewAllHref="/shop?new_arrival=1" />
          <ProductRow title="Best Sellers" products={state.bestSellers} viewAllHref="/shop?best_seller=1" />
          <ProductRow title="On Sale" products={state.onSale} viewAllHref="/shop?on_sale=1" />
        </>
      )}
    </div>
  );
}
