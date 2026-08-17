import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as productService from '../../services/admin/productService';
import * as categoryService from '../../services/admin/categoryService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

export default function AdminProducts() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    setLoading(true);
    productService
      .getProducts({ page, search: search || undefined, category_id: categoryId || undefined, per_page: 15 })
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, categoryId]);
  useEffect(() => {
    categoryService.getCategories({ per_page: 100 }).then((data) => setCategories(data.data));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleToggle(product) {
    await productService.toggleProductStatus(product.id);
    load();
  }

  async function handleDelete() {
    try {
      await productService.deleteProduct(deleteTarget.id);
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const products = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Products</h1>
        <div className="flex flex-wrap gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </form>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button as={Link} to="/admin/products/new" size="sm">+ Add Product</Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState title="No products yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <span className="font-medium text-slate-800">{p.name}</span>
                      {p.has_variations && <Badge color="purple">Variants</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-slate-500">{p.category?.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(p.sale_price ?? p.price)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(p)}>
                      <Badge color={p.status ? 'green' : 'slate'}>{p.status ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <Link to={`/admin/products/${p.id}`} className="text-emerald-700 hover:underline">Edit</Link>
                      <button onClick={() => setDeleteTarget(p)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this product?"
        message="This will permanently delete the product and its images."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
