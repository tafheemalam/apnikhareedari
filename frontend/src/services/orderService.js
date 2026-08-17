import api from './api';

export async function checkout(payload) {
  const { data } = await api.post('/checkout', payload);
  return data.data;
}

export async function getOrders(params = {}) {
  const { data } = await api.get('/orders', { params });
  return data.data;
}

export async function getOrder(orderNumber) {
  const { data } = await api.get(`/orders/${orderNumber}`);
  return data.data;
}

export async function cancelOrder(orderNumber, reason) {
  const { data } = await api.post(`/orders/${orderNumber}/cancel`, { reason });
  return data.data;
}

export function invoiceUrl(orderNumber) {
  return `/orders/${orderNumber}/invoice`;
}

export async function downloadInvoice(orderNumber) {
  const response = await api.get(`/orders/${orderNumber}/invoice`, { responseType: 'blob' });
  return response.data;
}
