import apiClient from '../../../apiClient';
import type { NotificationType, NotificationListResponse, MarkReadResponse, UnreadCountResponse, NotificationPreference } from '../types';

const BASE = '/notifications';

export const getNotifications = async (
  skip = 0,
  limit = 50,
  type?: NotificationType,
  isRead?: boolean
): Promise<NotificationListResponse> => {
  const response = await apiClient.get<NotificationListResponse>(BASE, {
    params: { skip, limit, type, is_read: isRead },
  });
  return response.data;
};

export const markAsRead = async (notificationId: string): Promise<MarkReadResponse> => {
  const response = await apiClient.put<MarkReadResponse>(`${BASE}/${notificationId}/read`);
  return response.data;
};

export const markAllAsRead = async (): Promise<MarkReadResponse> => {
  const response = await apiClient.put<MarkReadResponse>(`${BASE}/read-all`);
  return response.data;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`${BASE}/${notificationId}`);
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await apiClient.get<UnreadCountResponse>(`${BASE}/unread-count`);
  return response.data;
};

export const getPreferences = async (): Promise<NotificationPreference> => {
  const response = await apiClient.get<NotificationPreference>(`${BASE}/preferences`);
  return response.data;
};

export const updatePreferences = async (prefs: NotificationPreference): Promise<NotificationPreference> => {
  const response = await apiClient.put<NotificationPreference>(`${BASE}/preferences`, prefs);
  return response.data;
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getPreferences,
  updatePreferences,
};
