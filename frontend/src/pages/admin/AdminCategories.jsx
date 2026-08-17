import { useEffect, useState } from 'react';
import * as categoryService from '../../services/admin/categoryService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { Input, Select, Textarea, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const EMPTY = { name: '', parent_id: '', description: '', status: true, sort_order: 0, image: null };

export default function AdminCategories() {
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    setLoading(true);
    categoryService
      .getCategories({ page, search: search || undefined, per_page: 15 })
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(load, [page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, parent_id: cat.parent_id || '', description: cat.description || '', status: cat.status, sort_order: cat.sort_order || 0, image: null });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent_id: form.parent_id || null };
      if (editing) {
        await categoryService.updateCategory(editing.id, payload);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(payload);
        toast.success('Category created successfully');
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
      await categoryService.deleteCategory(deleteTarget.id);
      toast.success('Category deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleToggle(cat) {
    await categoryService.toggleCategoryStatus(cat.id);
    load();
  }

  const allCategories = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Categories</h1>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </form>
          <Button size="sm" onClick={openCreate}>+ Add Category</Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : allCategories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-500">{cat.parent?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{cat.products_count}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(cat)}>
                      <Badge color={cat.status ? 'green' : 'slate'}>{cat.status ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => openEdit(cat)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(cat)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <Modal open={modalOpen} title={editing ? 'Edit Category' : 'Add Category'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Select label="Parent Category" value={form.parent_id} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}>
            <option value="">None (top-level category)</option>
            {allCategories.filter((c) => c.id !== editing?.id).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Image</label>
            <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="text-sm" />
          </div>
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Category' : 'Create Category'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this category?"
        message="Categories with products or subcategories cannot be deleted."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
