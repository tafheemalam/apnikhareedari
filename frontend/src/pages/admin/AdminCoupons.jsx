import { useEffect, useState } from 'react';
import * as couponService from '../../services/admin/couponService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { Input, Select, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const EMPTY = { code: '', type: 'percentage', value: '', minimum_order_amount: '', maximum_discount_amount: '', usage_limit: '', status: true, expires_at: '' };

export default function AdminCoupons() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    setLoading(true);
    couponService.getCoupons({ page, per_page: 15 }).then(setResult).finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimum_order_amount: coupon.minimum_order_amount || '',
      maximum_discount_amount: coupon.maximum_discount_amount || '',
      usage_limit: coupon.usage_limit || '',
      status: coupon.status,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      ['minimum_order_amount', 'maximum_discount_amount', 'usage_limit', 'expires_at'].forEach((k) => {
        if (!payload[k]) payload[k] = null;
      });
      if (editing) {
        await couponService.updateCoupon(editing.id, payload);
        toast.success('Coupon updated successfully');
      } else {
        await couponService.createCoupon(payload);
        toast.success('Coupon created successfully');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await couponService.deleteCoupon(deleteTarget.id);
      toast.success('Coupon deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleToggle(coupon) {
    await couponService.toggleCouponStatus(coupon.id);
    load();
  }

  const coupons = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Coupons</h1>
        <Button size="sm" onClick={openCreate}>+ Add Coupon</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : coupons.length === 0 ? (
        <EmptyState title="No coupons yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">{c.code}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
                    {c.minimum_order_amount && <span className="block text-xs text-slate-400">Min: {formatCurrency(c.minimum_order_amount)}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td className="px-4 py-3 text-slate-500">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c)}>
                      <Badge color={c.status ? 'green' : 'slate'}>{c.status ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => openEdit(c)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <Modal open={modalOpen} title={editing ? 'Edit Coupon' : 'Add Coupon'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Coupon Code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </Select>
            <Input label="Value" type="number" step="0.01" required value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Minimum Order Amount" type="number" value={form.minimum_order_amount} onChange={(e) => setForm((f) => ({ ...f, minimum_order_amount: e.target.value }))} />
            <Input label="Maximum Discount" type="number" value={form.maximum_discount_amount} onChange={(e) => setForm((f) => ({ ...f, maximum_discount_amount: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Usage Limit" type="number" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
          </div>
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Coupon' : 'Create Coupon'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete this coupon?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
