import { useEffect, useState } from 'react';
import * as settingService from '../../services/admin/settingService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { Input, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY = { name: '', status: true, rate: '', free_shipping_threshold: '', estimated_delivery_days_min: '', estimated_delivery_days_max: '' };

export default function AdminShipping() {
  const toast = useToast();
  const [zones, setZones] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    settingService.getShippingZones().then(setZones);
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(zone) {
    setEditing(zone);
    setForm({
      name: zone.name,
      status: zone.status,
      rate: zone.rate ?? '',
      free_shipping_threshold: zone.free_shipping_threshold ?? '',
      estimated_delivery_days_min: zone.estimated_delivery_days_min ?? '',
      estimated_delivery_days_max: zone.estimated_delivery_days_max ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await settingService.updateShippingZone(editing.id, form);
        toast.success('Shipping zone updated successfully');
      } else {
        await settingService.createShippingZone(form);
        toast.success('Shipping zone created successfully');
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
      await settingService.deleteShippingZone(deleteTarget.id);
      toast.success('Shipping zone deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (!zones) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Shipping Zones</h1>
        <Button size="sm" onClick={openCreate}>+ Add Zone</Button>
      </div>

      {zones.length === 0 ? (
        <EmptyState title="No shipping zones configured" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Zone</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Free Shipping Over</th>
                <th className="px-4 py-3">Delivery Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((z) => (
                <tr key={z.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{z.name}</td>
                  <td className="px-4 py-3">{formatCurrency(z.rate)}</td>
                  <td className="px-4 py-3">{z.free_shipping_threshold ? formatCurrency(z.free_shipping_threshold) : '—'}</td>
                  <td className="px-4 py-3">{z.estimated_delivery_days_min ? `${z.estimated_delivery_days_min}-${z.estimated_delivery_days_max} days` : '—'}</td>
                  <td className="px-4 py-3"><Badge color={z.status ? 'green' : 'slate'}>{z.status ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => openEdit(z)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(z)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Zone' : 'Add Zone'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Zone / City Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Shipping Rate (PKR)" type="number" required value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
          <Input label="Free Shipping Threshold (PKR)" type="number" value={form.free_shipping_threshold} onChange={(e) => setForm((f) => ({ ...f, free_shipping_threshold: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Delivery Days" type="number" value={form.estimated_delivery_days_min} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery_days_min: e.target.value }))} />
            <Input label="Max Delivery Days" type="number" value={form.estimated_delivery_days_max} onChange={(e) => setForm((f) => ({ ...f, estimated_delivery_days_max: e.target.value }))} />
          </div>
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Zone' : 'Create Zone'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete this shipping zone?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
