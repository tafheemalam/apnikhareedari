export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>We collect the information you provide when creating an account, placing an order, or contacting
          support — including your name, email, phone number, and shipping address.</p>
        <h2 className="pt-2 text-base font-bold text-slate-900">How We Use Your Information</h2>
        <p>Your information is used to process orders, deliver products, communicate order updates, and improve
          our services. We do not sell your personal information to third parties.</p>
        <h2 className="pt-2 text-base font-bold text-slate-900">Payment Information</h2>
        <p>We never store your card number or CVV. Online payments are processed by our payment gateway
          partners, and only a transaction reference is retained on our systems.</p>
        <h2 className="pt-2 text-base font-bold text-slate-900">Data Security</h2>
        <p>We use industry-standard security practices, including encrypted connections and hashed passwords,
          to protect your data.</p>
        <h2 className="pt-2 text-base font-bold text-slate-900">Your Rights</h2>
        <p>You can update your profile information at any time from your account, or contact us to request
          deletion of your account and associated data.</p>
      </div>
    </div>
  );
}
