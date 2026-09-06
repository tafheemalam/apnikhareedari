import { useLocation, useParams, Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { formatCurrency } from '../utils/format';
import Button from '../components/ui/Button';

const METHOD_LABELS = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
};

const METHOD_LOGOS = {
  jazzcash: (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#CF0A2C" />
      <text x="24" y="32" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#FFD700">JC</text>
    </svg>
  ),
  easypaisa: (
    <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#1B5E20" />
      <text x="24" y="32" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#FFFFFF">EP</text>
    </svg>
  ),
};

export default function PaymentInstructions() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { settings } = useSite();

  const order = location.state?.order;
  const method = order?.payment_method ?? location.state?.method ?? 'jazzcash';
  const total = order?.total ?? 0;
  const itemCount = order?.items_count ?? location.state?.itemCount ?? 1;

  const accountNumber = settings['payment.mobile_payment_number'] || '03232665835';
  const accountTitle = settings['payment.account_title'] || 'Chohan Baba Store';
  const whatsappNumber = (settings['payment.whatsapp_number'] || '923232665835').replace(/^0/, '92');
  const methodLabel = METHOD_LABELS[method] ?? 'Mobile Payment';

  const whatsappText = encodeURIComponent(
    `Order ID: #${orderNumber}\nPayment Method: ${methodLabel}\nAmount: Rs. ${formatCurrency(total, false)}\n\nPlease find the payment screenshot attached.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  function copyNumber() {
    navigator.clipboard.writeText(accountNumber).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[#f0ede8] px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* Stepper */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </span>
            <span className="font-medium text-emerald-700">Cart</span>
          </div>
          <div className="h-px w-8 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-xs">2</span>
            <span className="font-semibold text-slate-800">Payment</span>
          </div>
          <div className="h-px w-8 bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-600 font-bold text-xs">3</span>
            <span className="text-slate-500">Confirmed</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">🔒 Secure Payment</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Complete Your Payment</h1>
          <p className="mt-1 text-sm text-slate-600">
            Send payment to the account below to confirm Order <strong>#{orderNumber}</strong>.
          </p>
        </div>

        {/* Amount card */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Amount to Pay</span>
            <span className="text-2xl font-extrabold text-slate-900">Rs. {total.toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Order ID: <strong className="text-slate-600">#{orderNumber}</strong> &middot; {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Payment method card */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            {METHOD_LOGOS[method]}
            <div>
              <p className="font-bold text-slate-900">{methodLabel}</p>
              <p className="text-xs text-slate-500">Send exactly Rs. {total.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Account Title</span>
              <span className="font-semibold text-slate-700">{accountTitle}</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{methodLabel} Number</span>
                <p className="mt-0.5 text-base font-bold text-slate-800">{accountNumber}</p>
              </div>
              <button
                onClick={copyNumber}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 active:scale-95"
              >
                Copy
              </button>
            </div>
          </div>

          <ol className="mt-4 space-y-1.5 text-sm text-slate-600">
            <li>1. Open your <strong>{methodLabel}</strong> app.</li>
            <li>2. Send <strong>Rs. {total.toLocaleString()}</strong> to the number above.</li>
            <li>3. Take a screenshot of the payment and send it on WhatsApp using the button below, along with the order ID.</li>
          </ol>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-base font-bold text-white shadow-sm hover:bg-[#22c05e] active:scale-[0.98] transition-transform"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          I've Paid — Send Screenshot on WhatsApp
        </a>

        {/* Footer note */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>
          Our team will verify the payment manually. Once verified, your order will be confirmed via WhatsApp / call / e-mail — don&apos;t forget to send the screenshot.
        </div>

        {/* Trust badges */}
        <div className="mt-4 flex justify-center gap-6 text-xs text-slate-400">
          <span>🔒 Encrypted &amp; Secure</span>
          <span>⚡ Fast Verification</span>
          <span>❤️ Trusted by Customers</span>
        </div>

        <div className="mt-4 text-center">
          <Link to="/shop" className="text-sm text-slate-500 underline hover:text-slate-700">
            Cancel and continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
