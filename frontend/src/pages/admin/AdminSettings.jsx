import { useEffect, useState } from 'react';
import * as settingService from '../../services/admin/settingService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';
import { Input, Checkbox } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TABS = [
  { key: 'store', label: 'Store' },
  { key: 'payment', label: 'Payment' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'tax', label: 'Tax' },
  { key: 'email', label: 'Email' },
  { key: 'social', label: 'Social Media' },
];

const FIELD_LABELS = {
  'store.name': 'Store Name',
  'store.email': 'Store Email',
  'store.phone': 'Store Phone',
  'store.address': 'Store Address',
  'payment.cod_enabled': 'Enable Cash on Delivery',
  'payment.online_enabled': 'Enable Online Payment',
  'payment.active_gateway': 'Active Online Gateway',
  'payment.jazzcash_enabled': 'Enable JazzCash',
  'payment.easypaisa_enabled': 'Enable EasyPaisa',
  'payment.mobile_payment_number': 'JazzCash / EasyPaisa Number',
  'payment.account_title': 'Account Title',
  'payment.whatsapp_number': 'WhatsApp Number (for payment screenshots)',
  'shipping.default_rate': 'Default Shipping Rate (PKR)',
  'shipping.free_shipping_threshold': 'Free Shipping Threshold (PKR)',
  'tax.enabled': 'Enable Tax',
  'tax.percentage': 'Tax Percentage (%)',
  'mail.from_address': 'From Email Address',
  'mail.from_name': 'From Name',
  'social.facebook': 'Facebook URL',
  'social.instagram': 'Instagram URL',
  'social.tiktok': 'TikTok URL',
  'social.youtube': 'YouTube URL',
};

const BOOLEAN_FIELDS = ['payment.cod_enabled', 'payment.online_enabled', 'payment.jazzcash_enabled', 'payment.easypaisa_enabled', 'tax.enabled'];
const BACKEND_ORIGIN = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

export default function AdminSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('store');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  function load() {
    settingService.getSettings().then((data) => {
      setSettings(data);
      setForm(data[activeTab] || {});
    });
  }

  useEffect(load, []);
  useEffect(() => {
    if (settings) setForm(settings[activeTab] || {});
  }, [activeTab, settings]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.updateSettingsGroup(activeTab, form);
      toast.success('Settings updated successfully');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload() {
    if (!logoFile) return;
    try {
      await settingService.uploadLogo(logoFile);
      toast.success('Logo uploaded successfully');
      setLogoFile(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  async function handleFaviconUpload() {
    if (!faviconFile) return;
    try {
      await settingService.uploadFavicon(faviconFile);
      toast.success('Favicon uploaded successfully');
      setFaviconFile(null);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }

  if (!settings) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-slate-900">Settings</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === tab.key ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        {Object.entries(form).map(([key, value]) =>
          BOOLEAN_FIELDS.includes(key) ? (
            <Checkbox
              key={key}
              label={FIELD_LABELS[key] || key}
              checked={value === '1' || value === true}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked ? '1' : '0' }))}
            />
          ) : (
            <Input
              key={key}
              label={FIELD_LABELS[key] || key}
              value={value ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          )
        )}
        <Button type="submit" loading={saving}>Save {TABS.find((t) => t.key === activeTab)?.label} Settings</Button>
      </form>

      {activeTab === 'store' && (
        <div className="mt-6 max-w-xl space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Store Logo</h3>
            {settings.store['store.logo'] && (
              <img src={`${BACKEND_ORIGIN}/storage/${settings.store['store.logo']}`} alt="Logo" className="mb-2 h-12" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} className="text-sm" />
            <Button type="button" size="sm" className="ml-2" onClick={handleLogoUpload} disabled={!logoFile}>Upload</Button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Favicon</h3>
            <input type="file" accept="image/*" onChange={(e) => setFaviconFile(e.target.files[0])} className="text-sm" />
            <Button type="button" size="sm" className="ml-2" onClick={handleFaviconUpload} disabled={!faviconFile}>Upload</Button>
          </div>
        </div>
      )}
    </div>
  );
}
