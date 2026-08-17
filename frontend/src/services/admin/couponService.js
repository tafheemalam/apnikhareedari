import api from '../api';

export async function getCoupons(params = {}) {
  const { data } = await api.get('/admin/coupons', { params });
  return data.data;
}

export async function createCoupon(payload) {
  const { data } = await api.post('/admin/coupons', payload);
  return data.data;
}

export async function updateCoupon(id, payload) {
  const { data } = await api.put(`/admin/coupons/${id}`, payload);
  return data.data;
}

export async function deleteCoupon(id) {
  const { data } = await api.delete(`/admin/coupons/${id}`);
  return data;
}

export async function toggleCouponStatus(id) {
  const { data } = await api.patch(`/admin/coupons/${id}/toggle-status`);
  return data.data;
}
