import axios from 'axios';

export const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:9765';

export const ENDPOINTS = {
  AUTH: {
    LOGIN:    '/auth/login',
    REGISTER: '/auth/register',
  },

  HOME: '/home',

  CATALOG: {
    SEARCH:         '/products/search',
    PRODUCTS:       '/products',
    PRODUCT_DETAIL: (id: number | string) => `/products/${id}`,
    BRANDS:         '/brands',
    CATEGORIES:     '/categories',
  },

  CART: {
    BASE: '/cart',
    ITEM: (productId: number | string) => `/cart/${productId}`,
  },

  USER: {
    DASHBOARD:  '/user/dashboard',
    PROFILE:    '/user/profile',
    PASSWORD:   '/user/password',
    ADDRESSES:  '/user/addresses',
  },

  ORDERS: {
    BASE:   '/orders',
    DETAIL: (id: number | string) => `/orders/${id}`,
  },

  PAYMENT: {
    BASE:     '/payment',
    BY_ORDER: (orderId: number | string) => `/payment/order/${orderId}`,
  },

  PROMOTIONS: {
    VALIDATE: '/promotions/validate',
  },

  WISHLIST: {
    BASE: '/wishlist',
    ITEM: (productId: number | string) => `/wishlist/${productId}`,
  },

  RETURNS: {
    BASE:   '/v1/returns',                          // khớp với ReturnRequestController
    DETAIL: (id: number | string) => `/v1/returns/${id}`,
  },

  WARRANTY: {
    BASE:   '/warranty',                            // khớp với WarrantyController
    DETAIL: (id: number | string) => `/warranty/${id}`,
  },

  NOTIFICATIONS: {
    BASE:     '/notifications',
    UNREAD:   '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
    READ_ONE: (id: number) => `/notifications/${id}/read`,
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  // AuthContext lưu token dưới key 'authToken'
  const token =
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error    => Promise.reject(error),
);

export default api;