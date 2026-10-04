import axios from 'axios';
import { BASE_API_URL } from '../constants/URL';

export const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Auth state is refreshed by the profile request; credentials stay HttpOnly.
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
