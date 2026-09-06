import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as catalogService from '../services/catalogService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Pagination from '../components/ui/Pagination';
import { useSite } from '../context/SiteContext';

const SORT_OPTIONS = [
  { value: '', label: 'Latest' },
  { value: 'price_low_high', label: 'Price: Low to High' },
  { value: 'price_high_low', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popular' },
  { value: 'best_selling', label: 'Best Selling' },
];

export default function ProductListing({ mode = 'shop' }) {
  const { categorySlug } = useParams();
  const { categories } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState({
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    min_rating: searchParams.get('min_rating') || '',
    availability: searchParams.get('availability') || '',
  });

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const page = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || '';

  const fetchProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = {
      page,
      sort: sort || undefined,
      search: mode === 'search' ? searchParams.get('search') || undefined : undefined,
      category_slug: mode === 'category' ? categorySlug : undefined,
      featured: searchParams.get('featured') || undefined,
      new_arrival: searchParams.get('new_arrival') || undefined,
      best_seller: searchParams.get('best_seller') || undefined,
      on_sale: searchParams.get('on_sale') || undefined,
      min_price: searchParams.get('min_price') || undefined,
      max_price: searchParams.get('max_price') || undefined,
      min_rating: searchParams.get('min_rating') || undefined,
      availability: searchParams.get('availability') || undefined,
    };

    catalogService
      .getProducts(params)
      .then((data) => !cancelled && setResult(data))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, categorySlug, page, sort, searchParams]);

  useEffect(() => fetchProducts(), [fetchProducts]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams.toString()]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function applyFilters() {
    const next = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete('page');
    setSearchParams(next);
  }

  const heading =
    mode === 'category' ? activeCategory?.name || 'Category' : mode === 'search' ? `Search: "${searchParams.get('search') || ''}"` : 'Shop';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">{heading}</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Filters</h3>

            {mode !== 'category' && (
              <div className="mb-4">
                <p className="mb-2 border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-slate-500">CATEGORY</p>
                <ul className="space-y-2 text-sm">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <a href={`/categories/${cat.slug}`} className="font-medium text-slate-700 hover:text-emerald-700">
                        {cat.name}
                      </a>
                      {cat.children?.length > 0 && (
                        <ul className="mt-1 ml-3 space-y-1 border-l border-slate-200 pl-3">
                          {cat.children.map((child) => (
                            <li key={child.id}>
                              <a href={`/categories/${child.slug}`} className="text-slate-500 hover:text-emerald-700">
                                {child.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {mode === 'category' && activeCategory?.children?.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-slate-500">SUBCATEGORIES</p>
                <ul className="space-y-1 text-sm">
                  {activeCategory.children.map((child) => (
                    <li key={child.id}>
                      <a href={`/categories/${child.slug}`} className="text-slate-600 hover:text-emerald-700">
                        {child.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-2 border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-slate-500">PRICE RANGE (PKR)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price}
                  onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price}
                  onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-slate-500">MINIMUM RATING</p>
              <select
                value={filters.min_rating}
                onChange={(e) => setFilters((f) => ({ ...f, min_rating: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                <option value="">Any rating</option>
                {[4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r}+ stars</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.availability === 'in_stock'}
                  onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.checked ? 'in_stock' : '' }))}
                />
                In stock only
              </label>
            </div>

            <button
              onClick={applyFilters}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{result?.total ?? 0} products found</p>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading && <LoadingSpinner />}
          {!loading && error && <ErrorState onRetry={fetchProducts} />}
          {!loading && !error && result?.data.length === 0 && (
            <EmptyState title="No products found" message="Try adjusting your filters or search terms." />
          )}
          {!loading && !error && result?.data.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {result.data.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination meta={result} onPageChange={(p) => updateParam('page', p)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
