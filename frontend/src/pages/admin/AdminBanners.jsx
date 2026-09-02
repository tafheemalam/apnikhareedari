import { useEffect, useState } from 'react';
import * as bannerService from '../../services/admin/bannerService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import { Input, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY = { title: '', link_url: '', status: true, sort_order: 0, image: null };

export default function AdminBanners() {
  const toast = useToast();
  const [banners, setBanners] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function load() {
    setLoading(true);
    bannerService.getBanners().then(setBanners).finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    if (!form.image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(form.image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(banner) {
    setEditing(banner);
    setForm({ title: banner.title || '', link_url: banner.link_url || '', status: banner.status, sort_order: banner.sort_order || 0, image: null });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editing && !form.image) {
      toast.error('Please choose an image for the banner');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await bannerService.updateBanner(editing.id, form);
        toast.success('Banner updated successfully');
      } else {
        await bannerService.createBanner(form);
        toast.success('Banner created successfully');
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
      await bannerService.deleteBanner(deleteTarget.id);
      toast.success('Banner deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleToggle(banner) {
    await bannerService.toggleBannerStatus(banner.id);
    load();
  }

  if (loading && !banners) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Homepage Banners</h1>
          <p className="mt-1 text-sm text-slate-500">Shown as a rotating slider at the top of the homepage. Add one to replace the default hero.</p>
        </div>
        <Button size="sm" onClick={openCreate}>+ Add Banner</Button>
      </div>

      {!banners?.length ? (
        <EmptyState title="No banners yet" message="The homepage will show the default hero until you add one." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="px-4 py-3">
                    <img src={banner.image_url} alt={banner.title || ''} className="h-12 w-24 rounded-md object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{banner.title || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{banner.link_url || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{banner.sort_order}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(banner)}>
                      <Badge color={banner.status ? 'green' : 'slate'}>{banner.status ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button onClick={() => openEdit(banner)} className="text-emerald-700 hover:underline">Edit</button>
                      <button onClick={() => setDeleteTarget(banner)} className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Banner' : 'Add Banner'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Image {!editing && <span className="text-red-500">*</span>}</label>
            <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="text-sm" />
            {(imagePreview || editing?.image_url) && (
              <img src={imagePreview || editing.image_url} alt="" className="mt-2 h-24 w-full rounded-md object-cover" />
            )}
          </div>
          <Input label="Title (optional overlay text)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input
            label="Link (optional — e.g. /shop or a full URL)"
            value={form.link_url}
            onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
          />
          <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} />
          <Checkbox label="Active" checked={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))} />
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Banner' : 'Create Banner'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this banner?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
