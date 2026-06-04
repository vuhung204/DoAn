import axios from 'axios';

export const BASE_URL = 'http://localhost:9765/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },

  HOME: '/home',   // ← THÊM MỚI

  CATALOG: {
    PRODUCTS: '/products',
    PRODUCT_DETAIL: (id: number | string) => `/products/${id}`,
    BRANDS: '/brands',
    CATEGORIES: '/categories',
  },

  CART: {
    BASE: '/cart',
    ITEM: (productId: number | string) => `/cart/${productId}`,
  },

  USER: {
    PROFILE: '/user/profile',
    PASSWORD: '/user/password',
    ADDRESSES: '/user/addresses',
  },

  ORDERS: {
    BASE: '/orders',
    DETAIL: (id: number | string) => `/orders/${id}`,
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;