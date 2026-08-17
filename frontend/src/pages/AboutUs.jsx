import { useSite } from '../context/SiteContext';

export default function AboutUs() {
  const { settings } = useSite();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">About {settings['store.name']}</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          {settings['store.name']} is a Pakistani online shopping destination dedicated to bringing quality
          electronics, fashion, home essentials, and more to your doorstep — with the convenience of Cash on
          Delivery available nationwide.
        </p>
        <p>
          We work with trusted suppliers to curate a catalog that's affordable without compromising on quality.
          Every order is packed with care and shipped quickly, because we know your time matters.
        </p>
        <p>
          Our mission is simple: make online shopping in Pakistan easy, reliable, and enjoyable for everyone —
          from first-time online shoppers to seasoned e-commerce veterans.
        </p>
        <h2 className="pt-2 text-lg font-bold text-slate-900">Why Shop With Us</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Wide selection across electronics, fashion, kids, and home categories</li>
          <li>Cash on Delivery across Pakistan, with secure online payment options too</li>
          <li>Fast, reliable delivery with real-time order tracking</li>
          <li>Hassle-free returns and dedicated customer support</li>
        </ul>
      </div>
    </div>
  );
}
