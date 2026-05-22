import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

// Interceptor për të dërguar tokenin në çdo kërkesë
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor për të kapur gabimet 401 dhe për të rifreskuar tokenin
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  
  // Nëse gabimi është 403 (Forbidden), pastrojmë të dhënat dhe e dërgojmë dërgojmë në login
  if (error.response?.status === 403) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    window.location.href = '/login?error=account_disabled';
    return Promise.reject(error);
  }

  // Nëse gabimi është 401 dhe nuk kemi provuar ende ta rifreskojmë
  if (error.response?.status === 401 && !originalRequest._retry) {
    // Shmangim loop-in e pafund nëse vetë endpointi /refresh kthen 401
    if (originalRequest.url === '/api/v1/auth/refresh') {
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const res = await axios.post('/api/v1/auth/refresh', {
        refresh_token: refreshToken
      });
      
      const newAccessToken = res.data.access_token;
      const newRefreshToken = res.data.refresh_token;
      
      // Përditësojmë storage me tokenat e rinj (në varësi ku ishin ruajtur më parë)
      if (localStorage.getItem('token')) {
        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
      } else if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('token', newAccessToken);
        if (newRefreshToken) sessionStorage.setItem('refreshToken', newRefreshToken);
      }
      
      // Përditësojmë headerin e kërkesës origjinale dhe e ridërgojmë
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Nëse rifreskimi dështon, pastrojmë të gjitha dhe mundësisht e dërgojmë në login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshToken');
      
      // Redirect to login if needed (or let AuthContext handle the missing token on re-render)
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
  
  return Promise.reject(error);
});

export default api;
