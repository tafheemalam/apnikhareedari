import { useEffect, useState } from 'react';
import * as basketService from '../../services/admin/basketService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { Input, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const EMPTY = { name: '', amount: '', status: true };

export default function AdminBaskets() {
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
    basketService.getBaskets({ page, per_page: 15 }).then(setResult).finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(basket) {
    setEditing(basket);
    setForm({ name: basket.name, amount: basket.amount, status: basket.status });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await basketService.updateBasket(editing.id, form);
        toast.success('Basket updated successfully');
      } else {
        await basketService.createBasket(form);
        toast.success('Basket created successfully');
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
      await basketService.deleteBasket(deleteTarget.id);
      toast.success('Basket deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleToggle(basket) {
    await basketService.toggleBasketStatus(basket.id);
    load();
  }

  const baskets = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Baskets</h1>
        <Button size="sm" onClick={openCreate}>+ Add Basket</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : baskets.length === 0 ? (
        <EmptyState title="No baskets yet" message="Create a fixed-price basket customers can fill with products up to its value." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baskets.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{b.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(b.amount)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(b)}>
                      <Badge color={b.status ? 'green' : 'slate'}>{b.status ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => openEdit(b)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(b)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <Modal open={modalOpen} title={editing ? 'Edit Basket' : 'Add Basket'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Rs. 500 Basket" />
          <Input label="Amount (PKR)" type="number" step="0.01" min="0.01" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Basket' : 'Create Basket'}</Button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete this basket?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
