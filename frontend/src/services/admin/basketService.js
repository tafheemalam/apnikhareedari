import api from '../api';

export async function getBaskets(params = {}) {
  const { data } = await api.get('/admin/baskets', { params });
  return data.data;
}

export async function createBasket(payload) {
  const { data } = await api.post('/admin/baskets', payload);
  return data.data;
}

export async function updateBasket(id, payload) {
  const { data } = await api.put(`/admin/baskets/${id}`, payload);
  return data.data;
}

export async function deleteBasket(id) {
  const { data } = await api.delete(`/admin/baskets/${id}`);
  return data;
}

export async function toggleBasketStatus(id) {
  const { data } = await api.patch(`/admin/baskets/${id}/toggle-status`);
  return data.data;
}
