import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const LAST_UPDATED = 'August 31, 2026';

export default function Terms() {
  const { settings } = useSite();
  const storeName = settings['store.name'] || 'ApniKhareedari';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Terms &amp; Conditions</h1>
      <p className="mt-1 text-xs text-slate-400">Last updated: {LAST_UPDATED}</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          Welcome to {storeName}. "We," "us," and "our" refer to {storeName}. These Terms &amp; Conditions (these
          "Terms") govern your access to and use of this website and the products and services we offer (the
          "Services"). By browsing, creating an account, or placing an order with us, you agree to be bound by
          these Terms and by our <Link to="/privacy-policy" className="font-medium text-emerald-700 hover:underline">Privacy Policy</Link>. If you do not agree, please do not use the
          Services.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">1. Your Account</h2>
        <p>
          To place an order you'll typically need an account with an accurate name, contact number, email, and
          delivery address. You're responsible for keeping your login credentials confidential and for any
          activity that happens under your account. Let us know right away if you suspect unauthorized access.
          Accounts are personal to you and may not be sold or transferred to someone else.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">2. Product Information</h2>
        <p>
          We try to describe and photograph products as accurately as possible, but actual color and appearance
          can vary slightly depending on your screen. Product descriptions, prices, and availability may change
          at any time without notice, and we may limit quantities or discontinue a product at our discretion.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">3. Placing an Order</h2>
        <p>
          Submitting an order is an offer to buy, not a guaranteed sale — we confirm acceptance once your order
          is placed (and, for online payments, once payment clears). We may decline or cancel an order for
          reasons such as stock unavailability, pricing errors, or suspected fraud, in which case we'll contact
          you using the details on your order. Please double-check your order before submitting, as changes
          after confirmation aren't always possible. Returns and exchanges follow whatever return window and
          conditions are stated on the product page or communicated by our support team. Orders are for personal
          or household use — not for resale.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">4. Pricing &amp; Payment</h2>
        <p>
          Prices are shown in Pakistani Rupees (PKR) and reflect what's in effect at the time you place your
          order, as confirmed in your order summary. Unless stated otherwise, listed prices exclude delivery
          charges. We accept Cash on Delivery and, where available, online payment. For online payments, you
          confirm that your payment details are accurate and that you're authorized to use the payment method
          provided.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">5. Shipping &amp; Delivery</h2>
        <p>
          Delivery estimates shown at checkout and on our <Link to="/shipping-info" className="font-medium text-emerald-700 hover:underline">Shipping Information</Link> page are our best estimate, not a
          guarantee — delays from couriers or events outside our control can occur. Once an order is handed to
          our delivery partner, risk of loss passes to you, though we'll work with you to resolve any delivery
          issue in good faith.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">6. Intellectual Property</h2>
        <p>
          The text, graphics, logos, and design of this website belong to {storeName} or our licensors and are
          protected under applicable copyright and trademark law. You may browse and use the Services for your
          own personal shopping — copying, reproducing, or reusing our content, images, or branding for any other
          purpose without our written permission isn't allowed.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">7. Third-Party Links</h2>
        <p>
          Some pages may link to third-party sites (like our social media pages). We don't control those sites
          and aren't responsible for their content or practices — anything you do there is between you and that
          third party.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">8. Reviews &amp; Other Content You Submit</h2>
        <p>
          If you post a product review, question, or other content on the Services, you confirm it's your own,
          truthful, and doesn't infringe anyone else's rights. You grant us permission to display and use what
          you submit in connection with operating and promoting the Services. We may remove content we
          reasonably consider inappropriate, misleading, or in breach of these Terms, though we're not obligated
          to monitor everything that's posted.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">9. Acceptable Use</h2>
        <p>You agree not to use the Services to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Break any applicable law or infringe someone else's rights;</li>
          <li>Submit false information, or impersonate another person;</li>
          <li>Send spam, malware, or attempt to disrupt or bypass our site's security;</li>
          <li>Scrape, resell, or republish our content or catalog data without permission; or</li>
          <li>Harass, threaten, or abuse our staff or other users.</li>
        </ul>
        <p>We may suspend or close an account that we reasonably believe violates these Terms.</p>

        <h2 className="pt-2 text-base font-bold text-slate-900">10. Errors &amp; Corrections</h2>
        <p>
          Occasionally a price, description, or availability shown on the site may be mistaken. We reserve the
          right to correct such errors, and to cancel or adjust an affected order — including one already placed
          — and will let you know if that happens.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">11. No Warranty</h2>
        <p>
          We provide the Services on an "as is" and "as available" basis. While we work to keep the site accurate
          and running smoothly, we don't guarantee it will always be uninterrupted, error-free, or perfectly
          accurate, and we can't promise a product will meet every expectation formed from its online description
          or photos.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">12. Limitation of Liability</h2>
        <p>
          To the extent permitted by law, {storeName} is not liable for indirect, incidental, or consequential
          damages arising from your use of the Services or the products purchased through them — our liability
          for any claim is limited to the amount you actually paid for the order in question.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">13. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time to reflect changes in how we operate or in applicable law.
          We'll revise the "Last updated" date above when we do — continuing to use the Services after an update
          means you accept the revised Terms.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">14. Governing Law</h2>
        <p>
          These Terms are governed by the laws of Pakistan, and any dispute arising from them will be subject to
          the courts having jurisdiction where {storeName} is based.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">15. Contact Us</h2>
        <p>Questions about these Terms? Reach us at:</p>
        <ul className="list-disc space-y-1 pl-5">
          {settings['store.address'] && <li>{settings['store.address']}</li>}
          {settings['store.phone'] && <li>{settings['store.phone']}</li>}
          {settings['store.email'] && <li>{settings['store.email']}</li>}
          <li>Or our <Link to="/contact" className="font-medium text-emerald-700 hover:underline">Contact Us</Link> page.</li>
        </ul>
      </div>
    </div>
  );
}
