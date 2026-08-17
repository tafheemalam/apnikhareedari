import api from '../api';

export async function getDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}
