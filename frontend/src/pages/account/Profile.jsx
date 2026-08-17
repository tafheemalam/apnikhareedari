import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';
import { extractErrorMessage } from '../../utils/format';
import { Input } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, phone: user.phone || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authService.updateProfile(profileForm);
      await refresh();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleProfileSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Profile Information</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Full Name" required value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" required value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <Button type="submit" size="sm" className="mt-4" loading={savingProfile}>Save Changes</Button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Change Password</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Current Password"
            type="password"
            required
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
          />
          <Input
            label="New Password"
            type="password"
            required
            value={passwordForm.password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            value={passwordForm.password_confirmation}
            onChange={(e) => setPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }))}
          />
        </div>
        <Button type="submit" size="sm" className="mt-4" loading={savingPassword}>Update Password</Button>
      </form>
    </div>
  );
}
