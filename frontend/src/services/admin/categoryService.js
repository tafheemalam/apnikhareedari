import api from '../api';
import { toFormData } from './formData';

export async function getCategories(params = {}) {
  const { data } = await api.get('/admin/categories', { params });
  return data.data;
}

export async function getCategory(id) {
  const { data } = await api.get(`/admin/categories/${id}`);
  return data.data;
}

export async function createCategory(payload) {
  const { data } = await api.post('/admin/categories', toFormData(payload));
  return data.data;
}

export async function updateCategory(id, payload) {
  const { data } = await api.post(`/admin/categories/${id}?_method=PUT`, toFormData(payload));
  return data.data;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/admin/categories/${id}`);
  return data;
}

export async function toggleCategoryStatus(id) {
  const { data } = await api.patch(`/admin/categories/${id}/toggle-status`);
  return data.data;
}
