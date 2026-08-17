import api from '../api';

export async function getAdminUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params });
  return data.data;
}

export async function createAdminUser(payload) {
  const { data } = await api.post('/admin/users', payload);
  return data.data;
}

export async function updateAdminUser(id, payload) {
  const { data } = await api.put(`/admin/users/${id}`, payload);
  return data.data;
}

export async function toggleAdminStatus(id) {
  const { data } = await api.patch(`/admin/users/${id}/toggle-status`);
  return data.data;
}

export async function getRoles() {
  const { data } = await api.get('/admin/roles');
  return data.data;
}
