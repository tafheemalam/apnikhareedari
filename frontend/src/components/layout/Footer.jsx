import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../../context/SiteContext';
import { useToast } from '../../context/ToastContext';

const BENEFITS = [
  { icon: '🚚', title: 'Fast Delivery', text: 'Nationwide shipping across Pakistan' },
  { icon: '💵', title: 'Cash on Delivery', text: 'Pay when your order arrives' },
  { icon: '↩️', title: 'Easy Returns', text: 'Hassle-free return policy' },
  { icon: '🔒', title: 'Secure Checkout', text: 'Your data is always protected' },
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
          <h4 className="mb-3 text-sm font-bold text-slate-900">{settings['store.name']}</h4>
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
            <li><Link to="/privacy-policy" className="hover:text-emerald-700">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-emerald-700">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-slate-900">Follow Us</h4>
          <div className="flex gap-3 text-sm text-slate-500">
            {settings['social.facebook'] && <a href={settings['social.facebook']} target="_blank" rel="noreferrer">Facebook</a>}
            {settings['social.instagram'] && <a href={settings['social.instagram']} target="_blank" rel="noreferrer">Instagram</a>}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {settings['store.name']}. All rights reserved.
      </div>
    </footer>
  );
}
