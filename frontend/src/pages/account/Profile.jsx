import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as authService from '../../services/authService';
import { extractErrorMessage } from '../../utils/format';
import {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  sanitizePhoneDigits,
  formatPhoneDisplay,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from '../../utils/validators';
import { Input, PasswordInput } from '../../components/ui/FormField';
import PasswordStrength from '../../components/ui/PasswordStrength';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { user, refresh } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({ name: user.name, email: user.email, phone: sanitizePhoneDigits(user.phone || '') });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  function validateProfile() {
    const next = {};
    if (!profileForm.name.trim()) next.name = 'Full name is required.';
    if (!isValidEmail(profileForm.email)) next.email = 'Enter a valid email address.';
    if (profileForm.phone && !isValidPhone(profileForm.phone)) next.phone = 'Enter a valid Pakistani mobile number, e.g. 0300 1234567.';
    setProfileErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePassword() {
    const next = {};
    if (!passwordForm.current_password) next.current_password = 'Current password is required.';
    if (!isStrongPassword(passwordForm.password)) next.password = PASSWORD_REQUIREMENTS_MESSAGE;
    if (passwordForm.password_confirmation !== passwordForm.password) next.password_confirmation = 'Passwords do not match.';
    setPasswordErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    if (!validateProfile()) return;

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
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      setPasswordErrors({});
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleProfileSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Profile Information</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Full Name"
            required
            error={profileErrors.name}
            value={profileForm.name}
            onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            required
            error={profileErrors.email}
            value={profileForm.email}
            onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="0300 1234567"
            error={profileErrors.phone}
            value={formatPhoneDisplay(profileForm.phone)}
            onChange={(e) => setProfileForm((f) => ({ ...f, phone: sanitizePhoneDigits(e.target.value) }))}
          />
        </div>
        <Button type="submit" size="sm" className="mt-4" loading={savingProfile}>Save Changes</Button>
      </form>

      <form onSubmit={handlePasswordSubmit} noValidate className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Change Password</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PasswordInput
            label="Current Password"
            required
            error={passwordErrors.current_password}
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
          />
          <div>
            <PasswordInput
              label="New Password"
              required
              error={passwordErrors.password}
              value={passwordForm.password}
              onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
            />
            <PasswordStrength password={passwordForm.password} />
          </div>
          <PasswordInput
            label="Confirm New Password"
            required
            error={passwordErrors.password_confirmation}
            value={passwordForm.password_confirmation}
            onChange={(e) => setPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }))}
          />
        </div>
        <Button type="submit" size="sm" className="mt-4" loading={savingPassword}>Update Password</Button>
      </form>
    </div>
  );
}
