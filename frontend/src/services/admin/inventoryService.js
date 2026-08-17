import api from '../api';

export async function getInventory(params = {}) {
  const { data } = await api.get('/admin/inventory', { params });
  return data.data;
}

export async function getLowStock() {
  const { data } = await api.get('/admin/inventory/low-stock');
  return data.data;
}

export async function getOutOfStock() {
  const { data } = await api.get('/admin/inventory/out-of-stock');
  return data.data;
}

export async function getHistory(inventoryId, page = 1) {
  const { data } = await api.get(`/admin/inventory/${inventoryId}/history`, { params: { page } });
  return data.data;
}

export async function increaseStock(inventoryId, payload) {
  const { data } = await api.post(`/admin/inventory/${inventoryId}/increase`, payload);
  return data.data;
}

export async function decreaseStock(inventoryId, payload) {
  const { data } = await api.post(`/admin/inventory/${inventoryId}/decrease`, payload);
  return data.data;
}

export async function setStock(inventoryId, payload) {
  const { data } = await api.post(`/admin/inventory/${inventoryId}/set`, payload);
  return data.data;
}
