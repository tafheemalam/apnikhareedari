import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useSite } from '../context/SiteContext';

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
  const { categories } = useSite();
  const [state, setState] = useState({ featured: [], newArrivals: [], bestSellers: [], onSale: [], loading: true });
  const [banners, setBanners] = useState([]);

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
    catalogService.getBanners().then(setBanners).catch(() => {});
  }, []);

  return (
    <div>
      {banners.length > 0 ? (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-6">
          <HeroSlider banners={banners} />
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">{cat.name}</span>
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
