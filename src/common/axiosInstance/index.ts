import axios from 'axios';
import { BASE_API_URL } from '../constants/URL';
import { storage } from '../utils';

export const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Optional auto token cleanup if expired
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
        // storage.removeToken();
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
