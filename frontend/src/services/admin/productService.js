import api from '../api';
import { toFormData } from './formData';

export async function getProducts(params = {}) {
  const { data } = await api.get('/admin/products', { params });
  return data.data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/admin/products/${id}`);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/admin/products', toFormData(payload));
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.post(`/admin/products/${id}?_method=PUT`, toFormData(payload));
  return data.data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
}

export async function toggleProductStatus(id) {
  const { data } = await api.patch(`/admin/products/${id}/toggle-status`);
  return data.data;
}

export async function deleteProductImage(productId, imageId) {
  const { data } = await api.delete(`/admin/products/${productId}/images/${imageId}`);
  return data;
}

export async function setPrimaryImage(productId, imageId) {
  const { data } = await api.patch(`/admin/products/${productId}/images/${imageId}/primary`);
  return data;
}

export async function getVariations(productId) {
  const { data } = await api.get(`/admin/products/${productId}/variations`);
  return data.data;
}

export async function createVariation(productId, payload) {
  const { data } = await api.post(`/admin/products/${productId}/variations`, toFormData(payload));
  return data.data;
}

export async function updateVariation(productId, variationId, payload) {
  const { data } = await api.post(`/admin/products/${productId}/variations/${variationId}?_method=PUT`, toFormData(payload));
  return data.data;
}

export async function deleteVariation(productId, variationId) {
  const { data } = await api.delete(`/admin/products/${productId}/variations/${variationId}`);
  return data;
}
