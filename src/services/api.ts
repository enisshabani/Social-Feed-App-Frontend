import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Porti ku po ekzekutohet backend-i
});

// Interceptor për të dërguar tokenin në çdo kërkesë
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
