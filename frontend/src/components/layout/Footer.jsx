import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';
import logoIcon from '../../assets/logo-icon.png';

const BENEFITS = [
  { icon: '🚚', title: 'Fast Delivery', text: 'Nationwide shipping across Pakistan' },
  { icon: '💵', title: 'Cash on Delivery', text: 'Pay when your order arrives' },
  { icon: '↩️', title: 'Easy Returns', text: 'Hassle-free return policy' },
  { icon: '🔒', title: 'Secure Checkout', text: 'Your data is always protected' },
];

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13.5 21v-7.9h2.66l.4-3.1h-3.06V8.06c0-.9.25-1.5 1.53-1.5h1.64V3.77C15.98 3.68 15.05 3.6 13.96 3.6c-2.28 0-3.84 1.4-3.84 3.94v2.46H7.46v3.1h2.66V21h3.38Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16.6 3c.3 2 1.7 3.6 3.7 3.9v2.6c-1.4 0-2.7-.4-3.7-1.2v6.4c0 3-2.5 5.3-5.4 5.3-3 0-5.4-2.4-5.4-5.3S8.3 9.4 11.2 9.4c.3 0 .6 0 .9.1v2.7c-.3-.1-.6-.2-.9-.2-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.8-1.1 2.8-2.7V3h2.6Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M21.6 7.5c-.2-1-1-1.7-2-2C17.9 5 12 5 12 5s-5.9 0-7.6.5c-1 .3-1.8 1-2 2C2 9.2 2 12 2 12s0 2.8.4 4.5c.2 1 1 1.7 2 2C6.1 19 12 19 12 19s5.9 0 7.6-.5c1-.3 1.8-1 2-2 .4-1.7.4-4.5.4-4.5s0-2.8-.4-4.5ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { key: 'social.facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'social.instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'social.tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'social.youtube', label: 'YouTube', Icon: YouTubeIcon },
];

export default function Footer() {
  const { settings } = useSite();
  const toast = useToast();
  const [email, setEmail] = useState('');

  function handleNewsletter(e) {
    e.preventDefault();
    if (!email) return;
    toast.success('Thanks for subscribing! Watch your inbox for deals.');
    setEmail('');
  }

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 border-b border-slate-100 px-4 py-8 sm:grid-cols-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="flex flex-col items-center gap-1 text-center">
            <span className="text-2xl">{b.icon}</span>
            <p className="text-sm font-semibold text-slate-800">{b.title}</p>
            <p className="text-xs text-slate-500">{b.text}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl bg-emerald-700 px-4 py-8 text-center text-white">
        <h3 className="text-lg font-bold">Subscribe to our Newsletter</h3>
        <p className="mt-1 text-sm text-emerald-100">Get the latest deals and offers straight to your inbox.</p>
        <form onSubmit={handleNewsletter} className="mx-auto mt-4 flex max-w-md gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full rounded-lg px-4 py-2 text-sm text-slate-900 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold hover:bg-slate-800">
            Subscribe
          </button>
        </form>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <img src={logoIcon} alt="" className="h-6 w-auto" />
            <h4 className="text-sm font-bold text-slate-900">{settings['store.name']}</h4>
          </div>
          <p className="text-xs text-slate-500">{settings['store.address']}</p>
          <p className="mt-2 text-xs text-slate-500">{settings['store.phone']}</p>
          <p className="text-xs text-slate-500">{settings['store.email']}</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-900">Shop</h4>
          <ul className="space-y-2 text-xs text-slate-500">
            <li><Link to="/shop" className="hover:text-emerald-700">All Products</Link></li>
            <li><Link to="/shop?sort=new_arrival" className="hover:text-emerald-700">New Arrivals</Link></li>
            <li><Link to="/shop?on_sale=1" className="hover:text-emerald-700">On Sale</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-900">Company</h4>
          <ul className="space-y-2 text-xs text-slate-500">
            <li><Link to="/about" className="hover:text-emerald-700">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-700">Contact Us</Link></li>
            <li><Link to="/shipping-info" className="hover:text-emerald-700">Shipping Information</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-emerald-700">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-emerald-700">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-900">Follow Us</h4>
          <div className="flex gap-2">
            {SOCIAL_LINKS.map(({ key, label, Icon }) => settings[key] && (
              <a
                key={key}
                href={settings[key]}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-emerald-600 hover:text-white"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {settings['store.name']}. All rights reserved.
      </div>
    </footer>
  );
}
