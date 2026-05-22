import axios from 'axios';
import { FollowResponse, FollowCountResponse, IsFollowingResponse } from '../types';

// Depending on Vite or Create React App, environment variables are accessed differently.
// Using a fallback mechanism to safely resolve the REACT_APP_API_URL or VITE_API_URL.
const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (import.meta && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta && import.meta.env && import.meta.env.REACT_APP_API_URL) {
    return import.meta.env.REACT_APP_API_URL;
  }
  return 'http://localhost:8000/api/v1';
};

const API_URL = `${getBaseUrl()}/follows`;

const followsApi = axios.create({
  baseURL: API_URL,
});

// Interceptor to attach JWT
followsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const followUser = async (userId: number): Promise<FollowResponse> => {
  const response = await followsApi.post<FollowResponse>(`/${userId}`);
  return response.data;
};

export const unfollowUser = async (userId: number): Promise<void> => {
  await followsApi.delete(`/${userId}`);
};

export const getFollowers = async (userId: number, skip = 0, limit = 50): Promise<FollowResponse[]> => {
  const response = await followsApi.get<FollowResponse[]>(`/followers/${userId}`, { params: { skip, limit } });
  return response.data;
};

export const getFollowing = async (userId: number, skip = 0, limit = 50): Promise<FollowResponse[]> => {
  const response = await followsApi.get<FollowResponse[]>(`/following/${userId}`, { params: { skip, limit } });
  return response.data;
};

export const getFollowCounts = async (userId: number): Promise<FollowCountResponse> => {
  const response = await followsApi.get<FollowCountResponse>(`/counts/${userId}`);
  return response.data;
};

export const checkIsFollowing = async (userId: number): Promise<IsFollowingResponse> => {
  const response = await followsApi.get<IsFollowingResponse>(`/check/${userId}`);
  return response.data;
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowCounts,
  checkIsFollowing,
};
