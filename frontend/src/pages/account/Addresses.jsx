import { useEffect, useState } from 'react';
import * as addressService from '../../services/addressService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { isValidPhone, sanitizePhoneDigits, formatPhoneDisplay } from '../../utils/validators';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/FormField';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY = { label: '', full_name: '', phone: '', address_line: '', city: '', area: '', postal_code: '', is_default: false };

export default function Addresses() {
  const { user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function validate() {
    const next = {};
    if (!form.full_name.trim()) next.full_name = 'Full name is required.';
    if (!isValidPhone(form.phone, { required: true })) next.phone = 'Enter a valid Pakistani mobile number, e.g. 0300 1234567.';
    if (!form.city.trim()) next.city = 'City is required.';
    if (!form.address_line.trim()) next.address_line = 'Address is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function load() {
    addressService.getAddresses().then(setAddresses);
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, full_name: user.name || '', phone: sanitizePhoneDigits(user.phone || '') });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(address) {
    setEditing(address);
    setForm({ ...address, phone: sanitizePhoneDigits(address.phone || '') });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (editing) {
        await addressService.updateAddress(editing.id, form);
        toast.success('Address updated successfully');
      } else {
        await addressService.createAddress(form);
        toast.success('Address added successfully');
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
      await addressService.deleteAddress(deleteTarget.id);
      toast.success('Address deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleSetDefault(id) {
    await addressService.setDefaultAddress(id);
    load();
  }

  if (!addresses) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={openCreate}>+ Add Address</Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState title="No addresses saved" message="Add an address to speed up checkout." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{addr.label || 'Address'} {addr.is_default && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">DEFAULT</span>}</p>
                  <p className="mt-1 text-sm text-slate-600">{addr.full_name}</p>
                  <p className="text-sm text-slate-500">{addr.address_line}, {addr.area}</p>
                  <p className="text-sm text-slate-500">{addr.city} {addr.postal_code}</p>
                  <p className="text-sm text-slate-500">{addr.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs font-medium">
                <button onClick={() => openEdit(addr)} className="text-emerald-700 hover:underline">Edit</button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-slate-600 hover:underline">Set as Default</button>
                )}
                <button onClick={() => setDeleteTarget(addr)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Address' : 'Add Address'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Label (e.g. Home)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <Input
            label="Full Name"
            required
            error={errors.full_name}
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Phone"
            type="tel"
            required
            placeholder="0300 1234567"
            error={errors.phone}
            value={formatPhoneDisplay(form.phone)}
            onChange={(e) => setForm((f) => ({ ...f, phone: sanitizePhoneDigits(e.target.value) }))}
          />
          <Input
            label="City"
            required
            error={errors.city}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            label="Address"
            required
            className="sm:col-span-2"
            error={errors.address_line}
            value={form.address_line}
            onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
          />
          <Input label="Area" value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} />
          <Input label="Postal Code" value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
            Set as default address
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving} className="w-full">{editing ? 'Update Address' : 'Add Address'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this address?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
