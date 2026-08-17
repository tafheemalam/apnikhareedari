import api, { setAuthToken, clearCartToken } from './api';

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  setAuthToken(data.data.token);
  clearCartToken();
  return data.data.user;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  setAuthToken(data.data.token);
  clearCartToken();
  return data.data.user;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    setAuthToken(null);
  }
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/profile', payload);
  return data.data;
}

export async function changePassword(payload) {
  const { data } = await api.put('/profile/password', payload);
  return data;
}
