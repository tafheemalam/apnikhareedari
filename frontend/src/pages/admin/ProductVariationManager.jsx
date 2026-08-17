import { useState } from 'react';
import * as productService from '../../services/admin/productService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Checkbox } from '../../components/ui/FormField';

const EMPTY_VARIATION = { sku: '', price: '', sale_price: '', quantity: '', low_stock_threshold: 5, status: true, image: null };

export default function ProductVariationManager({ productId, variations, onChange }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_VARIATION);
  const [options, setOptions] = useState([{ attribute_name: '', attribute_value: '' }]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_VARIATION);
    setOptions([{ attribute_name: 'Size', attribute_value: '' }, { attribute_name: 'Color', attribute_value: '' }]);
    setModalOpen(true);
  }

  function openEdit(variation) {
    setEditing(variation);
    setForm({
      sku: variation.sku,
      price: variation.price ?? '',
      sale_price: variation.sale_price ?? '',
      quantity: variation.stock_quantity ?? 0,
      low_stock_threshold: variation.low_stock_threshold ?? 5,
      status: variation.status,
      image: null,
    });
    setOptions(variation.options.length ? variation.options : [{ attribute_name: '', attribute_value: '' }]);
    setModalOpen(true);
  }

  function updateOption(index, field, value) {
    setOptions((current) => current.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)));
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
        <Button type="button" size="sm" onClick={openCreate}>+ Add Variation</Button>
      </div>

      {variations.length === 0 ? (
        <p className="text-sm text-slate-500">No variations yet. Add one to enable size/color options.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs font-semibold uppercase text-slate-500">
            <tr>
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
                <td className="py-2">{v.label}</td>
                <td className="py-2 text-slate-500">{v.sku}</td>
                <td className="py-2">{formatCurrency(v.current_price)}</td>
                <td className="py-2">{v.stock_quantity}</td>
                <td className="py-2">
                  <div className="flex gap-3 text-xs font-medium">
                    <button type="button" onClick={() => openEdit(v)} className="text-emerald-700 hover:underline">Edit</button>
                    <button type="button" onClick={() => setDeleteTarget(v)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Variation' : 'Add Variation'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs font-semibold text-slate-500">ATTRIBUTES</p>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
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
            <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="text-sm" />
          </div>
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />

          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Variation' : 'Add Variation'}</Button>
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
