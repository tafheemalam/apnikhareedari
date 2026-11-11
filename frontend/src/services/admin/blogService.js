import api from '../api';
import { toFormData } from './formData';

export async function getBlogPosts(params = {}) {
  const { data } = await api.get('/admin/blog-posts', { params });
  return data.data;
}

export async function getBlogPost(id) {
  const { data } = await api.get(`/admin/blog-posts/${id}`);
  return data.data;
}

export async function createBlogPost(payload) {
  const { data } = await api.post('/admin/blog-posts', toFormData(payload));
  return data.data;
}

export async function updateBlogPost(id, payload) {
  const { data } = await api.post(`/admin/blog-posts/${id}?_method=PUT`, toFormData(payload));
  return data.data;
}

export async function deleteBlogPost(id) {
  const { data } = await api.delete(`/admin/blog-posts/${id}`);
  return data;
}

export async function toggleBlogPostStatus(id) {
  const { data } = await api.patch(`/admin/blog-posts/${id}/toggle-status`);
  return data.data;
}
