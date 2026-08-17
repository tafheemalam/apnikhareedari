import { useEffect, useState } from 'react';
import * as userService from '../../services/admin/userService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Input, Checkbox } from '../../components/ui/FormField';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';

const EMPTY = { name: '', email: '', phone: '', password: '', roles: [] };

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    userService.getAdminUsers({ page, per_page: 15 }).then(setResult).finally(() => setLoading(false));
  }

  useEffect(load, [page]);
  useEffect(() => { userService.getRoles().then(setRoles); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(admin) {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, phone: admin.phone || '', password: '', roles: admin.roles });
    setModalOpen(true);
  }

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        await userService.updateAdminUser(editing.id, payload);
        toast.success('Admin user updated successfully');
      } else {
        await userService.createAdminUser(payload);
        toast.success('Admin user created successfully');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(admin) {
    try {
      await userService.toggleAdminStatus(admin.id);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  const admins = result?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Admin Users</h1>
        <Button size="sm" onClick={openCreate}>+ Add Admin User</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : admins.length === 0 ? (
        <EmptyState title="No admin users yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{admin.name}</td>
                  <td className="px-4 py-3 text-slate-500">{admin.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {admin.roles.map((r) => <Badge key={r} color="purple">{r}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(admin)} disabled={admin.id === currentUser.id}>
                      <Badge color={admin.is_active ? 'green' : 'slate'}>{admin.is_active ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(admin)} className="text-xs font-medium text-emerald-700 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={result} onPageChange={setPage} />

      <Modal open={modalOpen} title={editing ? 'Edit Admin User' : 'Add Admin User'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Full Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input
            label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            required={!editing}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Roles</label>
            <div className="space-y-1">
              {roles.map((role) => (
                <Checkbox key={role} label={role} checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
              ))}
            </div>
          </div>
          <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Admin User' : 'Create Admin User'}</Button>
        </form>
      </Modal>
    </div>
  );
}
