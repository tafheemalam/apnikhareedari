import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import * as productService from '../../services/admin/productService';
import * as categoryService from '../../services/admin/categoryService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input, Select, Textarea, Checkbox } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ProductVariationManager from './ProductVariationManager';

const EMPTY = {
  category_id: '',
  name: '',
  sku: '',
  barcode: '',
  short_description: '',
  description: '',
  price: '',
  sale_price: '',
  cost_price: '',
  has_variations: false,
  status: true,
  featured: false,
  new_arrival: false,
  best_seller: false,
  stock_quantity: '',
  low_stock_threshold: 5,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [product, setProduct] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    categoryService.getCategories({ per_page: 100 }).then((data) => setCategories(data.data));
  }, []);

  function loadProduct() {
    productService.getProduct(id).then((data) => {
      setProduct(data);
      setForm({
        category_id: data.category.id,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || '',
        short_description: data.short_description || '',
        description: data.description || '',
        price: data.price,
        sale_price: data.sale_price || '',
        cost_price: data.cost_price || '',
        has_variations: data.has_variations,
        status: data.status,
        featured: data.featured,
        new_arrival: data.new_arrival,
        best_seller: data.best_seller,
        stock_quantity: data.stock_quantity,
        low_stock_threshold: 5,
      });
      setLoading(false);
    });
  }

  useEffect(() => {
    if (isEdit) loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, images: newImages };
      if (isEdit) {
        await productService.updateProduct(id, payload);
        toast.success('Product updated successfully');
        setNewImages([]);
        loadProduct();
      } else {
        const created = await productService.createProduct(payload);
        toast.success('Product created successfully');
        navigate(`/admin/products/${created.id}`);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteImage(imageId) {
    await productService.deleteProductImage(id, imageId);
    loadProduct();
  }

  async function handleSetPrimary(imageId) {
    await productService.setPrimaryImage(id, imageId);
    loadProduct();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/admin/products" className="text-xs text-emerald-700 hover:underline">← Back to products</Link>
      <h1 className="mb-6 mt-1 text-xl font-bold text-slate-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select label="Category" required value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Product Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="SKU" required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            <Input label="Barcode" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} />
            <Input label="Short Description" className="sm:col-span-2" value={form.short_description} onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))} />
            <Textarea label="Full Description" className="sm:col-span-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Pricing</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input label="Price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Input label="Sale Price" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))} />
            <Input label="Cost Price" type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Flags</h2>
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
            <Checkbox label="Featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            <Checkbox label="New Arrival" checked={form.new_arrival} onChange={(e) => setForm((f) => ({ ...f, new_arrival: e.target.checked }))} />
            <Checkbox label="Best Seller" checked={form.best_seller} onChange={(e) => setForm((f) => ({ ...f, best_seller: e.target.checked }))} />
            <Checkbox
              label="Has Variations (Size/Color etc.)"
              checked={form.has_variations}
              disabled={isEdit}
              onChange={(e) => setForm((f) => ({ ...f, has_variations: e.target.checked }))}
            />
          </div>
        </div>

        {!form.has_variations && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Stock</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Stock Quantity"
                type="number"
                required={!isEdit}
                disabled={isEdit}
                value={form.stock_quantity}
                onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
              />
              {isEdit && <p className="self-end pb-2 text-xs text-slate-400">Adjust stock from the Inventory page.</p>}
              {!isEdit && (
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
                />
              )}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Images</h2>
          {product?.images?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  {img.is_primary && <span className="absolute left-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Primary</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 py-1">
                    {!img.is_primary && (
                      <button type="button" onClick={() => handleSetPrimary(img.id)} className="text-[10px] font-semibold text-white hover:underline">Set primary</button>
                    )}
                    <button type="button" onClick={() => handleDeleteImage(img.id)} className="text-[10px] font-semibold text-red-300 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewImages(Array.from(e.target.files))}
            className="text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">You can select multiple images. The first uploaded image becomes primary if none is set.</p>
        </div>

        <Button type="submit" size="lg" loading={saving}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
      </form>

      {isEdit && product && (
        <div className="mt-6">
          <ProductVariationManager productId={id} variations={product.variations} onChange={loadProduct} />
        </div>
      )}
    </div>
  );
}
