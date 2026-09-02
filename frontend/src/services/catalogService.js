import api from './api';

export async function getBanners() {
  const { data } = await api.get('/banners');
  return data.data;
}

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.data;
}

export async function getCategory(slug) {
  const { data } = await api.get(`/categories/${slug}`);
  return data.data;
}

export async function getProducts(params = {}) {
  const { data } = await api.get('/products', { params });
  return data.data;
}

export async function getProduct(slug) {
  const { data } = await api.get(`/products/${slug}`);
  return data.data;
}

export async function getProductReviews(productId, page = 1) {
  const { data } = await api.get(`/products/${productId}/reviews`, { params: { page } });
  return data.data;
}

export async function submitReview(productId, payload) {
  const { data } = await api.post(`/products/${productId}/reviews`, payload);
  return data.data;
}

export async function getProductQuestions(productId, page = 1) {
  const { data } = await api.get(`/products/${productId}/questions`, { params: { page } });
  return data.data;
}

export async function submitQuestion(productId, payload) {
  const { data } = await api.post(`/products/${productId}/questions`, payload);
  return data.data;
}

export async function submitAnswer(questionId, payload) {
  const { data } = await api.post(`/questions/${questionId}/answers`, payload);
  return data.data;
}

export async function getPublicSettings() {
  const { data } = await api.get('/settings/public');
  return data.data;
}

export async function getShippingZones() {
  const { data } = await api.get('/shipping/zones');
  return data.data;
}

export async function estimateShipping(city, subtotal) {
  const { data } = await api.post('/shipping/estimate', { city, subtotal });
  return data.data;
}

export async function validateCoupon(code, subtotal) {
  const { data } = await api.post('/coupons/validate', { code, subtotal });
  return data.data;
}
