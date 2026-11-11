import { useEffect, useState } from 'react';
import * as catalogService from '../services/catalogService';
import { useSite } from '../context/SiteContext';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Seo from '../components/common/Seo';

export default function ShippingInfo() {
  const [zones, setZones] = useState(null);
  const { settings } = useSite();

  useEffect(() => {
    catalogService.getShippingZones().then(setZones);
  }, []);

  const baseRate = Number(settings['shipping.weight_base_rate'] ?? 300);
  const incrementRate = Number(settings['shipping.weight_increment_rate'] ?? 150);
  const weightRows = [1, 2, 3].map((kg) => ({ kg, amount: baseRate + incrementRate * (kg - 1) }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Seo title="Shipping Information" description="Delivery charges, delivery times and Cash on Delivery details for ApniKhareedari orders across Pakistan." path="/shipping-info" />
      <h1 className="text-2xl font-bold text-slate-900">Shipping Information</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          We deliver nationwide across Pakistan. Shipping is charged by the total weight of your order (the same
          rate applies to every city), and orders above the free-shipping threshold for your area ship at no
          extra cost.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Shipping Charges by Weight</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order Weight</th>
                <th className="px-4 py-3">Shipping Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {weightRows.map((row) => (
                <tr key={row.kg}>
                  <td className="px-4 py-3 font-medium text-slate-800">Up to {row.kg} kg</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Beyond 3 kg, an additional {formatCurrency(incrementRate)} applies for every extra kilogram. The exact
          shipping cost for your order is calculated automatically at checkout.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Free Shipping &amp; Delivery Times</h2>
        {!zones && <LoadingSpinner />}
        {zones && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Free Shipping Above</th>
                  <th className="px-4 py-3">Estimated Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zones.map((zone) => (
                  <tr key={zone.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{zone.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(zone.free_shipping_threshold)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {zone.estimated_delivery_days_min}–{zone.estimated_delivery_days_max} business days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="pt-2 text-base font-bold text-slate-900">Order Processing</h2>
        <p>
          Orders are processed and handed to our courier partners within 1 business day of confirmation. You'll
          receive updates as your order is packed, shipped, and delivered.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Cash on Delivery</h2>
        <p>
          Cash on Delivery is available nationwide — pay in cash when your order arrives at your doorstep.
          Online payment is also available at checkout where you'd prefer to pay upfront.
        </p>

        <h2 className="pt-2 text-base font-bold text-slate-900">Tracking Your Order</h2>
        <p>
          Once your order ships, you can track its status anytime from your account under{' '}
          <span className="font-medium text-slate-800">My Orders</span>.
        </p>
      </div>
    </div>
  );
}
