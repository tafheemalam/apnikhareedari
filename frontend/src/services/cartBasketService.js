import api from './api';

export async function startBasket(basketId) {
  const { data } = await api.post('/cart/baskets', { basket_id: basketId });
  return data.data;
}

export async function addBasketItem(cartBasketId, payload) {
  const { data } = await api.post(`/cart/baskets/${cartBasketId}/items`, payload);
  return data.data;
}

export async function removeBasketItem(cartBasketId, itemId) {
  const { data } = await api.delete(`/cart/baskets/${cartBasketId}/items/${itemId}`);
  return data.data;
}

export async function removeBasketInstance(cartBasketId) {
  const { data } = await api.delete(`/cart/baskets/${cartBasketId}`);
  return data.data;
}
