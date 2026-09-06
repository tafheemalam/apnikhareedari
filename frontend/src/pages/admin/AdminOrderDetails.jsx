import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as orderService from '../../services/admin/orderService';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime, extractErrorMessage } from '../../utils/format';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormField';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrderDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    orderService.getOrder(id).then(setOrder);
  }

  useEffect(load, [id]);

  async function handleStatusChange(status) {
    setSavingStatus(true);
    try {
      const updated = await orderService.updateOrderStatus(id, status);
      setOrder(updated);
      toast.success('Order status updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingStatus(false);
    }
  }

  async function handlePaymentChange(paymentStatus) {
    setSavingPayment(true);
    try {
      const updated = await orderService.updatePaymentStatus(id, paymentStatus);
      setOrder(updated);
      toast.success('Payment status updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const updated = await orderService.cancelOrder(id);
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
    const blob = await orderService.downloadInvoice(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.order_number}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (!order) return <LoadingSpinner />;

  return (
    <div>
      <Link to="/admin/orders" className="text-xs text-emerald-700 hover:underline">← Back to orders</Link>
      <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{order.order_number}</h1>
          <p className="text-xs text-slate-500">Placed on {formatDateTime(order.placed_at)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleInvoice}>Download Invoice</Button>
          {order.is_cancellable && <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>Cancel Order</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Items</h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{item.basket_id ? `🧺 ${item.product_name}` : item.product_name}</p>
                      {item.variation_label && <p className="text-xs text-slate-500">{item.variation_label}</p>}
                      <p className="text-xs text-slate-400">SKU: {item.sku} · Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                    </div>
                    <span className="font-semibold text-slate-900">{formatCurrency(item.line_total)}</span>
                  </div>
                  {item.basket_id && item.basket_items?.length > 0 && (
                    <ul className="mt-2 ml-4 space-y-1 border-l-2 border-emerald-100 pl-3 text-xs text-slate-500">
                      {item.basket_items.map((bi) => (
                        <li key={bi.id}>
                          {bi.product_name}{bi.variation_label ? ` (${bi.variation_label})` : ''} × {bi.quantity} — SKU: {bi.sku}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Shipping Address</h2>
              <p className="text-sm text-slate-600">
                {order.shipping.full_name}<br />
                {order.shipping.address}, {order.shipping.area}<br />
                {order.shipping.city} {order.shipping.postal_code}<br />
                {order.shipping.phone}
              </p>
            </div>
            {order.customer && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-2 text-sm font-bold text-slate-900">Customer</h2>
                <p className="text-sm text-slate-600">{order.customer.name}</p>
                <p className="text-sm text-slate-500">{order.customer.email}</p>
              </div>
            )}
            {order.delivery_notes && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2">
                <h2 className="mb-2 text-sm font-bold text-slate-900">Delivery Notes</h2>
                <p className="text-sm text-slate-600">{order.delivery_notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Order Status</h2>
            <Select value={order.status} disabled={savingStatus} onChange={(e) => handleStatusChange(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-bold text-slate-900">Payment Status</h2>
            <p className="mb-2 text-xs text-slate-500">Method: {order.payment_method.toUpperCase()}</p>
            <Select value={order.payment_status} disabled={savingPayment} onChange={(e) => handlePaymentChange(e.target.value)}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          {order.payments?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-bold text-slate-900">Payment Records</h2>
              {order.payments.map((p) => (
                <div key={p.id} className="mb-2 text-xs text-slate-500 last:mb-0">
                  <p><Badge>{p.status}</Badge> via {p.gateway}</p>
                  {p.transaction_id && <p>Txn: {p.transaction_id}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message="This will restock all items in the order."
        confirmLabel="Yes, Cancel Order"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
