import api from '../api';

export async function getOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params });
  return data.data;
}

export async function getOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.put(`/admin/orders/${id}/status`, { status });
  return data.data;
}

export async function updatePaymentStatus(id, paymentStatus) {
  const { data } = await api.put(`/admin/orders/${id}/payment-status`, { payment_status: paymentStatus });
  return data.data;
}

export async function cancelOrder(id, reason) {
  const { data } = await api.post(`/admin/orders/${id}/cancel`, { reason });
  return data.data;
}

export async function downloadInvoice(id) {
  const response = await api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });
  return response.data;
}
