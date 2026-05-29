import axios from 'axios';
import { getCurrentTenantId } from '../utils/tenant';

const getBaseUrl = () => {
  const normalizeApiRoot = (url: string) =>
    url.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');

  if (import.meta.env?.VITE_API_URL) {
    return normalizeApiRoot(import.meta.env.VITE_API_URL);
  }
  return '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Interceptor për të dërguar tokenin në çdo kërkesë
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  config.headers['X-Tenant-ID'] = getCurrentTenantId();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  // Catch cases where Firebase or a proxy returns HTML instead of JSON
  if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
    return Promise.reject(new Error("API returned an HTML response. The backend might be unreachable."));
  }
  return response;
}, (error) => {
  return Promise.reject(error);
});

// Auth API (gjithashtu mund të mbahen këtu)
export const login = (data: any) => api.post('/api/v1/auth/login', data);
export const register = (data: any) => api.post('/api/v1/auth/register', data);

// Posts API
export const getPosts = () => api.get('/api/v1/posts/');
export const createPost = (data: { content: string }) => api.post('/api/v1/posts/', data);
export const createComment = (postId: number, data: { content: string }) => api.post(`/api/v1/posts/${postId}/comments`, data);
export const likePost = (postId: number) => api.post(`/api/v1/posts/${postId}/like`);
export const repostPost = (postId: number) => api.post(`/api/v1/posts/${postId}/repost`);

export default api;
