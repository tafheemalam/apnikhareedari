import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const LAST_UPDATED = 'August 31, 2026';

export default function PrivacyPolicy() {
  const { settings } = useSite();
  const storeName = settings['store.name'] || 'ApniKhareedari';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-1 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          This page explains what information {storeName} collects when you browse or shop with us, why we
          collect it, and the choices you have. By using this website you agree to the practices described here.
          If anything here conflicts with our <Link to="/terms" className="font-medium text-emerald-700 hover:underline">Terms &amp; Conditions</Link>, this Privacy Policy takes
          precedence for questions about your personal data.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">1. Information We Collect</h2>
        <p>We only collect what we need to run your orders and account:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Identity &amp; contact details</strong> — name, phone number, email, and the shipping/billing addresses you give us.</li>
          <li><strong>Account details</strong> — your login email and an encrypted password; we never store passwords in plain text.</li>
          <li><strong>Order history</strong> — products ordered, quantities, prices at time of purchase, order status, and your chosen payment method (Cash on Delivery or online payment).</li>
          <li><strong>Payment details</strong> — for online payments, card numbers are handled directly by our payment processor; we keep only a transaction reference, never your full card number or CVV.</li>
          <li><strong>Your activity on the site</strong> — items in your cart or wishlist, reviews and product questions you post, and support messages you send us.</li>
          <li><strong>Technical data</strong> — IP address and browser/device details, used mainly for security and troubleshooting.</li>
        </ul>

        <h2 className="pt-2 text-base font-bold text-slate-900">2. Where This Information Comes From</h2>
        <p>
          Almost everything comes straight from you — creating an account, placing an order, writing a review, or
          messaging support. A small amount is collected automatically as you browse (for example, session and
          cart data). We do not buy personal information about you from data brokers.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">3. Why We Use It</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To take, process, pack, and ship your orders, and to handle returns or exchanges.</li>
          <li>To keep your account working — order history, saved addresses, and wishlist.</li>
          <li>To answer your support questions and respond to product questions or reviews you post.</li>
          <li>To send order-related messages (confirmations, shipping updates) and, only if you've opted in, occasional promotions or newsletters — which you can opt out of at any time.</li>
          <li>To detect and prevent fraudulent orders or account misuse.</li>
          <li>To meet legal obligations, such as responding to a lawful request from an authority.</li>
        </ul>

        <h2 className="pt-2 text-base font-bold text-slate-900">4. Who We Share It With</h2>
        <p>We do not sell your personal information. We share it only where it's needed to run the store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Our courier/delivery partners, so your order can actually reach you.</li>
          <li>Our payment processor, to complete online payments.</li>
          <li>Our hosting and infrastructure providers, who store the data that powers this site.</li>
          <li>Government or law enforcement bodies, only when we're legally required to.</li>
          <li>A buyer or successor, if {storeName}'s business is ever sold or restructured — your data would remain protected under an equivalent policy.</li>
        </ul>

        <h2 className="pt-2 text-base font-bold text-slate-900">5. Links to Other Sites</h2>
        <p>
          Pages on this site may link out to third parties (our social media pages, for instance). Once you leave
          our site, their own privacy practices apply — we'd encourage you to check them before sharing anything.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">6. Children</h2>
        <p>
          This store isn't intended for use by children, and we don't knowingly collect personal information from
          them. If you believe a child has given us personal information, contact us and we'll remove it.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">7. Keeping Your Data Safe</h2>
        <p>
          Passwords are stored hashed, not in plain text, and connections to this site are encrypted. That said,
          no online system is 100% immune to risk, so please avoid sending sensitive details (like full card
          numbers) through unencrypted channels such as email. We keep your data only as long as your account is
          active or as needed to satisfy legal and accounting requirements.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">8. Your Choices</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Review and update your details anytime from your account profile.</li>
          <li>Request a copy of your data, or ask us to delete your account and associated data, by contacting us.</li>
          <li>Unsubscribe from marketing emails using the link in any promotional email — you'll still get essential order-related messages.</li>
        </ul>
        <p>We won't treat you any differently for exercising these choices.</p>

        <h2 className="pt-2 text-base font-bold text-slate-900">9. Changes to This Policy</h2>
        <p>
          If we change how we handle your data, we'll update this page and revise the "Last updated" date above,
          so it's worth checking back occasionally.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">10. Contact Us</h2>
        <p>Questions about your data, or want to exercise any of the choices above? Reach us at:</p>
        <ul className="list-disc space-y-1 pl-5">
          {settings['store.phone'] && <li>{settings['store.phone']}</li>}
          {settings['store.email'] && <li>{settings['store.email']}</li>}
          <li>Or our <Link to="/contact" className="font-medium text-emerald-700 hover:underline">Contact Us</Link> page.</li>
        </ul>
      </div>
    </div>
  );
}
