import axios from 'axios';
import { getCurrentTenantId } from './utils/tenant';

const getBaseUrl = () => {
  const normalizeApiRoot = (url: string) =>
    `${url.replace(/\/+$/, '').replace(/\/api\/v1$/i, '')}/api/v1`;

  const shouldIgnoreLocalhostApi = (url: string) => {
    if (typeof window === 'undefined') return false;
    const pageHost = window.location.hostname;
    const isLocalPage = ['localhost', '127.0.0.1', '0.0.0.0'].includes(pageHost);
    try {
      const apiHost = new URL(url).hostname;
      return !isLocalPage && ['localhost', '127.0.0.1', '0.0.0.0'].includes(apiHost);
    } catch {
      return false;
    }
  };

  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    if (shouldIgnoreLocalhostApi(process.env.REACT_APP_API_URL)) return '/api/v1';
    return normalizeApiRoot(process.env.REACT_APP_API_URL);
  }
  if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
    if (shouldIgnoreLocalhostApi(import.meta.env.VITE_API_URL)) return '/api/v1';
    return normalizeApiRoot(import.meta.env.VITE_API_URL);
  }
  if (import.meta && import.meta.env && import.meta.env.REACT_APP_API_URL) {
    if (shouldIgnoreLocalhostApi(import.meta.env.REACT_APP_API_URL)) return '/api/v1';
    return normalizeApiRoot(import.meta.env.REACT_APP_API_URL);
  }
  return '/api/v1';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
});

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers['X-Tenant-ID'] = getCurrentTenantId();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => {
    // Catch cases where Firebase or a proxy returns HTML instead of JSON
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      return Promise.reject(new Error("API returned an HTML response. The backend might be unreachable."));
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("apiClient caught 401 Unauthorized. Not redirecting to avoid loops.");
      // Clear token but do not force redirect
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
