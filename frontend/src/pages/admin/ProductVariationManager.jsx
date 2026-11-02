import { useEffect, useState } from 'react';
import * as productService from '../../services/admin/productService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Checkbox } from '../../components/ui/FormField';

const EMPTY_VARIATION = { sku: '', price: '', sale_price: '', quantity: '', low_stock_threshold: 5, status: true, image: null, remove_image: false };
const EMPTY_GENERATE_FORM = { sku_prefix: '', price: '', sale_price: '', quantity: 0, low_stock_threshold: 5 };

export default function ProductVariationManager({ productId, variations, onChange }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_VARIATION);
  const [options, setOptions] = useState([{ attribute_name: '', attribute_value: '' }]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [sizesText, setSizesText] = useState('');
  const [colorRows, setColorRows] = useState([{ name: '', image: null }]);
  const [generateForm, setGenerateForm] = useState(EMPTY_GENERATE_FORM);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!form.image) {
      setNewImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(form.image);
    setNewImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  function openCreate() {
    setEditing(null);
    setIsDuplicate(false);
    setForm(EMPTY_VARIATION);
    setOptions([{ attribute_name: 'Size', attribute_value: '' }, { attribute_name: 'Color', attribute_value: '' }]);
    setModalOpen(true);
  }

  function openDuplicate(variation) {
    setEditing(null);
    setIsDuplicate(true);
    setForm({
      sku: `${variation.sku}-copy`,
      price: variation.price ?? '',
      sale_price: variation.sale_price ?? '',
      quantity: variation.stock_quantity ?? 0,
      low_stock_threshold: variation.low_stock_threshold ?? 5,
      status: variation.status,
      image: null,
      remove_image: false,
    });
    setOptions(
      variation.options.length
        ? variation.options.map((o) => ({ attribute_name: o.attribute_name, attribute_value: o.attribute_value }))
        : [{ attribute_name: '', attribute_value: '' }]
    );
    setModalOpen(true);
  }

  function openEdit(variation) {
    setEditing(variation);
    setIsDuplicate(false);
    setForm({
      sku: variation.sku,
      price: variation.price ?? '',
      sale_price: variation.sale_price ?? '',
      quantity: variation.stock_quantity ?? 0,
      low_stock_threshold: variation.low_stock_threshold ?? 5,
      status: variation.status,
      image: null,
      remove_image: false,
    });
    setOptions(variation.options.length ? variation.options : [{ attribute_name: '', attribute_value: '' }]);
    setModalOpen(true);
  }

  function handleRemoveImage() {
    setForm((f) => ({ ...f, image: null, remove_image: true }));
  }

  function updateOption(index, field, value) {
    setOptions((current) => current.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)));
  }

  function removeOption(index) {
    setOptions((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cleanOptions = options.filter((o) => o.attribute_name && o.attribute_value);
    if (cleanOptions.length === 0) {
      toast.error('Add at least one attribute (e.g. Size: M)');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, options: cleanOptions };
      if (editing) {
        await productService.updateVariation(productId, editing.id, payload);
        toast.success('Variation updated successfully');
      } else {
        await productService.createVariation(productId, payload);
        toast.success('Variation added successfully');
      }
      setModalOpen(false);
      onChange();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function openGenerate() {
    setSizesText('');
    setColorRows([{ name: '', image: null }]);
    setGenerateForm(EMPTY_GENERATE_FORM);
    setGenerateModalOpen(true);
  }

  function updateColorRow(index, field, value) {
    setColorRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeColorRow(index) {
    setColorRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleGenerate(e) {
    e.preventDefault();
    const sizes = sizesText.split(',').map((s) => s.trim()).filter(Boolean);
    const colors = colorRows.filter((c) => c.name.trim());

    if (sizes.length === 0) {
      toast.error('Add at least one size (comma-separated, e.g. S, M, L)');
      return;
    }
    if (colors.length === 0) {
      toast.error('Add at least one color');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        sizes,
        colors: colors.map((c) => (c.image ? { name: c.name.trim(), image: c.image } : { name: c.name.trim() })),
        sku_prefix: generateForm.sku_prefix || undefined,
        price: generateForm.price || undefined,
        sale_price: generateForm.sale_price || undefined,
        quantity: generateForm.quantity,
        low_stock_threshold: generateForm.low_stock_threshold,
      };
      const result = await productService.generateVariations(productId, payload);
      toast.success(
        result.skipped_count > 0
          ? `${result.created_count} variations created, ${result.skipped_count} already existed and were skipped`
          : `${result.created_count} variations created`
      );
      setGenerateModalOpen(false);
      onChange();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete() {
    try {
      await productService.deleteVariation(productId, deleteTarget.id);
      toast.success('Variation deleted successfully');
      setDeleteTarget(null);
      onChange();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Variations</h2>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={openGenerate}>⚡ Generate from Sizes + Colors</Button>
          <Button type="button" size="sm" onClick={openCreate}>+ Add Variation</Button>
        </div>
      </div>

      {variations.length === 0 ? (
        <p className="text-sm text-slate-500">No variations yet. Add one to enable size/color options.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="py-2">Image</th>
              <th className="py-2">Variation</th>
              <th className="py-2">SKU</th>
              <th className="py-2">Price</th>
              <th className="py-2">Stock</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variations.map((v) => (
              <tr key={v.id}>
                <td className="py-2">
                  {v.image_url ? (
                    <img src={v.image_url} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-slate-300 text-[9px] text-slate-400">
                      None
                    </div>
                  )}
                </td>
                <td className="py-2">{v.label}</td>
                <td className="py-2 text-slate-500">{v.sku}</td>
                <td className="py-2">{formatCurrency(v.current_price)}</td>
                <td className="py-2">{v.stock_quantity}</td>
                <td className="py-2">
                  <div className="flex gap-3 text-xs font-medium">
                    <button type="button" onClick={() => openEdit(v)} className="text-emerald-700 hover:underline">Edit</button>
                    <button type="button" onClick={() => openDuplicate(v)} className="text-slate-600 hover:underline">Duplicate</button>
                    <button type="button" onClick={() => setDeleteTarget(v)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Variation' : isDuplicate ? 'Duplicate Variation' : 'Add Variation'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {isDuplicate && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Copied from an existing variation. Update the SKU and the attribute(s) that differ (e.g. Size or Color), then save.
            </p>
          )}
          <p className="text-xs font-semibold text-slate-500">ATTRIBUTES</p>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Attribute (e.g. Size)"
                value={opt.attribute_name}
                onChange={(e) => updateOption(i, 'attribute_name', e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Value (e.g. M)"
                value={opt.attribute_value}
                onChange={(e) => updateOption(i, 'attribute_value', e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {options.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label="Remove attribute"
                  className="shrink-0 text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions((c) => [...c, { attribute_name: '', attribute_value: '' }])}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            + Add another attribute
          </button>

          <Input label="SKU" required value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (leave blank to use product price)" type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Input label="Sale Price" type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))} />
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Initial Stock" type="number" required value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Image</label>
            {editing?.image_url && !form.image && !form.remove_image && (
              <div className="mb-2 flex items-center gap-2">
                <img src={editing.image_url} alt="" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
                <span className="text-xs text-slate-500">Current image — choose a file below to replace it.</span>
                <button type="button" onClick={handleRemoveImage} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            )}
            {form.remove_image && !form.image && (
              <p className="mb-2 text-xs text-slate-500">Image will be removed on save.</p>
            )}
            {newImagePreview && (
              <div className="mb-2 flex items-center gap-2">
                <img src={newImagePreview} alt="" className="h-14 w-14 rounded-lg border border-emerald-400 object-cover" />
                <span className="text-xs text-emerald-700">New image selected — will replace the current one on save.</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] || null, remove_image: false }))}
              className="text-sm"
            />
          </div>
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />

          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Variation' : 'Add Variation'}</Button>
        </form>
      </Modal>

      <Modal open={generateModalOpen} title="Generate Variations from Sizes + Colors" onClose={() => setGenerateModalOpen(false)}>
        <form onSubmit={handleGenerate} className="space-y-3">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Creates one variation for every size × color combination. Each color only needs one photo — it's reused
            across all of that color's sizes. Combinations that already exist are skipped automatically.
          </p>

          <Input
            label="Sizes (comma-separated)"
            placeholder="e.g. S, M, L, XL"
            required
            value={sizesText}
            onChange={(e) => setSizesText(e.target.value)}
          />

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Colors</p>
            <div className="space-y-2">
              {colorRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <input
                    placeholder="Color name (e.g. Red)"
                    value={row.name}
                    onChange={(e) => updateColorRow(i, 'name', e.target.value)}
                    className="w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => updateColorRow(i, 'image', e.target.files[0] || null)}
                    className="w-1/2 text-xs"
                  />
                  {colorRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColorRow(i)}
                      aria-label="Remove color"
                      className="shrink-0 text-slate-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setColorRows((c) => [...c, { name: '', image: null }])}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
            >
              + Add another color
            </button>
          </div>

          <Input
            label="SKU prefix (optional, defaults to product SKU)"
            value={generateForm.sku_prefix}
            onChange={(e) => setGenerateForm((f) => ({ ...f, sku_prefix: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price (leave blank to use product price)"
              type="number"
              step="0.01"
              value={generateForm.price}
              onChange={(e) => setGenerateForm((f) => ({ ...f, price: e.target.value }))}
            />
            <Input
              label="Sale Price"
              type="number"
              step="0.01"
              value={generateForm.sale_price}
              onChange={(e) => setGenerateForm((f) => ({ ...f, sale_price: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial stock (per variation)"
              type="number"
              required
              value={generateForm.quantity}
              onChange={(e) => setGenerateForm((f) => ({ ...f, quantity: e.target.value }))}
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              value={generateForm.low_stock_threshold}
              onChange={(e) => setGenerateForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
          </div>

          <Button type="submit" loading={generating} className="w-full">Generate Variations</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this variation?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
