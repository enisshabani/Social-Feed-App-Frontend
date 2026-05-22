import axios from 'axios';
import { NotificationType, NotificationListResponse, MarkReadResponse, UnreadCountResponse } from '../types';

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

const API_URL = `${getBaseUrl()}/notifications`;

const notificationsApi = axios.create({
  baseURL: API_URL,
});

notificationsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getNotifications = async (skip = 0, limit = 50, type?: NotificationType, isRead?: boolean): Promise<NotificationListResponse> => {
  const response = await notificationsApi.get<NotificationListResponse>('', {
    params: { skip, limit, type, is_read: isRead }
  });
  return response.data;
};

export const markAsRead = async (notificationId: string): Promise<MarkReadResponse> => {
  const response = await notificationsApi.put<MarkReadResponse>(`/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<MarkReadResponse> => {
  const response = await notificationsApi.put<MarkReadResponse>('/read-all');
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await notificationsApi.delete(`/${notificationId}`);
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await notificationsApi.get<UnreadCountResponse>('/unread-count');
  return response.data;
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
