import api from '../api';
import { toFormData } from './formData';

export async function getBanners() {
  const { data } = await api.get('/admin/banners');
  return data.data;
}

export async function createBanner(payload) {
  const { data } = await api.post('/admin/banners', toFormData(payload));
  return data.data;
}

export async function updateBanner(id, payload) {
  const { data } = await api.post(`/admin/banners/${id}?_method=PUT`, toFormData(payload));
  return data.data;
}

export async function deleteBanner(id) {
  const { data } = await api.delete(`/admin/banners/${id}`);
  return data;
}

export async function toggleBannerStatus(id) {
  const { data } = await api.patch(`/admin/banners/${id}/toggle-status`);
  return data.data;
}
