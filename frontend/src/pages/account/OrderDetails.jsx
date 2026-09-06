import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as orderService from '../../services/orderService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function OrderDetails() {
  const { orderNumber } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    setLoading(true);
    orderService
      .getOrder(orderNumber)
      .then(setOrder)
      .finally(() => setLoading(false));
  }

  useEffect(load, [orderNumber]);

  async function handleCancel() {
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(orderNumber);
      setOrder(updated);
      toast.success('Order cancelled successfully');
      setConfirmCancel(false);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  }

  async function handleInvoice() {
    try {
      const blob = await orderService.downloadInvoice(orderNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download invoice');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!order) return <p className="text-sm text-slate-500">Order not found.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/account/orders" className="text-xs text-emerald-700 hover:underline">← Back to orders</Link>
          <h2 className="text-lg font-bold text-slate-900">{order.order_number}</h2>
          <p className="text-xs text-slate-500">Placed on {formatDateTime(order.placed_at)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleInvoice}>Download Invoice</Button>
          {order.is_cancellable && (
            <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>Cancel Order</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Order Status</p>
          <Badge>{order.status}</Badge>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Payment</p>
          <p className="text-sm font-medium">{order.payment_method.toUpperCase()} · <Badge>{order.payment_status}</Badge></p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Items</h3>
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  {item.basket_id ? (
                    <p className="font-medium text-slate-700">🧺 {item.product_name}</p>
                  ) : (
                    <Link to={item.product_slug ? `/products/${item.product_slug}` : '#'} className="font-medium text-slate-700 hover:text-emerald-700">
                      {item.product_name}
                    </Link>
                  )}
                  {item.variation_label && <p className="text-xs text-slate-500">{item.variation_label}</p>}
                  <p className="text-xs text-slate-400">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(item.line_total)}</span>
              </div>
              {item.basket_id && item.basket_items?.length > 0 && (
                <ul className="mt-2 ml-4 space-y-1 border-l-2 border-emerald-100 pl-3 text-xs text-slate-500">
                  {item.basket_items.map((bi) => (
                    <li key={bi.id}>{bi.product_name}{bi.variation_label ? ` (${bi.variation_label})` : ''} × {bi.quantity}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          {Number(order.discount_amount) > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span></div>}
          <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span></div>
          {Number(order.tax_amount) > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>}
          <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-bold text-slate-900">Shipping Address</h3>
          <p className="text-sm text-slate-600">
            {order.shipping.full_name}<br />
            {order.shipping.address}, {order.shipping.area}<br />
            {order.shipping.city} {order.shipping.postal_code}<br />
            {order.shipping.phone}
          </p>
        </div>
        {order.delivery_notes && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Delivery Notes</h3>
            <p className="text-sm text-slate-600">{order.delivery_notes}</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="This will cancel your order and restock the items. This cannot be undone."
        confirmLabel="Yes, Cancel Order"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
