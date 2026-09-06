import api from './api';

export async function getActiveBaskets() {
  const { data } = await api.get('/baskets');
  return data.data;
}
