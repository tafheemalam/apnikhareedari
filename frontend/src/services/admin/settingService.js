import api from '../api';

export async function getSettings() {
  const { data } = await api.get('/admin/settings');
  return data.data;
}

export async function updateSettingsGroup(group, values) {
  const { data } = await api.put('/admin/settings', { group, values });
  return data.data;
}

export async function uploadLogo(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/admin/settings/logo', formData);
  return data.data;
}

export async function uploadFavicon(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/admin/settings/favicon', formData);
  return data.data;
}

export async function getShippingZones() {
  const { data } = await api.get('/admin/shipping-zones');
  return data.data;
}

export async function createShippingZone(payload) {
  const { data } = await api.post('/admin/shipping-zones', payload);
  return data.data;
}

export async function updateShippingZone(id, payload) {
  const { data } = await api.put(`/admin/shipping-zones/${id}`, payload);
  return data.data;
}

export async function deleteShippingZone(id) {
  const { data } = await api.delete(`/admin/shipping-zones/${id}`);
  return data;
}
