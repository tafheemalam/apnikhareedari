import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input, Textarea } from '../components/ui/FormField';
import Button from '../components/ui/Button';

export default function ContactUs() {
  const { settings } = useSite();
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', message: '' });
  const [sending, setSending] = useState(false);

  // Auth loads asynchronously, so the user may not be known yet on first render
  // (this page is public, unlike checkout). Fill in once it arrives, without
  // clobbering anything already typed.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
  }, [user]);

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Thanks for reaching out! We'll get back to you soon.");
      setForm({ name: user?.name || '', email: user?.email || '', message: '' });
      setSending(false);
    }, 600);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
      <p className="mt-2 text-sm text-slate-600">We'd love to hear from you. Reach out with any questions or feedback.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <Input label="Your Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Textarea label="Message" required value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          <Button type="submit" loading={sending} className="w-full">Send Message</Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Get in Touch</h2>
            <p className="text-sm text-slate-600">{settings['store.address']}</p>
            <p className="mt-2 text-sm text-slate-600">📞 {settings['store.phone']}</p>
            <p className="text-sm text-slate-600">✉️ {settings['store.email']}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Customer Support Hours</h2>
            <p className="text-sm text-slate-600">Monday – Saturday: 9:00 AM – 7:00 PM</p>
            <p className="text-sm text-slate-600">Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
