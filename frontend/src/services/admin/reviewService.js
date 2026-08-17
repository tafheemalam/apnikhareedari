import api from '../api';

export async function getReviews(params = {}) {
  const { data } = await api.get('/admin/reviews', { params });
  return data.data;
}

export async function approveReview(id) {
  const { data } = await api.patch(`/admin/reviews/${id}/approve`);
  return data.data;
}

export async function rejectReview(id) {
  const { data } = await api.patch(`/admin/reviews/${id}/reject`);
  return data.data;
}

export async function deleteReview(id) {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
}
