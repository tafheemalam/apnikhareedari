import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';

export default function ReturnPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Seo
        title="Return & Replacement Policy"
        description="How returns, replacements, and refunds work at ApniKhareedari."
        path="/return-policy"
      />
      <h1 className="text-2xl font-bold text-slate-900">Return &amp; Replacement Policy</h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          Whether an item arrived damaged or defective, or you simply want to return or exchange something you
          no longer need, let us know and we'll work with you to make it right.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Photo &amp; Video Proof Required</h2>
        <p>
          Photo and video evidence of the item and its packaging is mandatory to claim a return or replacement.
          Requests submitted without clear photo/video proof cannot be processed.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">How We Decide</h2>
        <p>
          We accept return and replacement requests for both defective/damaged items and non-defective items
          (for example, if you simply changed your mind or no longer need the product). Every request is reviewed
          individually, and the outcome — replacement, return, or refund — is decided on a case-by-case basis.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Exceptions</h2>
        <p>
          Personalized and made-to-order items (such as custom-engraved or name-printed products) are made
          specifically for you and are not eligible for return or replacement unless they arrive damaged or
          defective.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Delivery Charges</h2>
        <p>
          If your request is approved, any delivery charges for returning the item or shipping a replacement will
          be confirmed with you after we've reviewed your request.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">How to Start a Request</h2>
        <p>
          Reach out via our{' '}
          <Link to="/contact" className="font-medium text-emerald-700 hover:underline">
            Contact Us
          </Link>{' '}
          page with your order number along with the required photos and video, and our support team will guide
          you through the next steps.
        </p>
      </div>
    </div>
  );
}
