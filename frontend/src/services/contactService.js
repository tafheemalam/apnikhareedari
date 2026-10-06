import api from './api';

export async function submitContactForm(payload) {
  const { data } = await api.post('/contact', payload);
  return data;
}
