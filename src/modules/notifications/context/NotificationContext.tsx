import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from '../api/notificationsApi';
import { NotificationItem, NotificationType } from '../types';

interface NotificationContextState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (skip?: number, limit?: number, type?: NotificationType, isRead?: boolean) => Promise<void>;
  markAsReadById: (id: string) => Promise<void>;
  markAllAsReadBulk: () => Promise<void>;
  deleteNotificationById: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async (skip = 0, limit = 50, type?: NotificationType, isRead?: boolean) => {
    setIsLoading(true);
    try {
      const data = await getNotifications(skip, limit, type, isRead);
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsReadById = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await markAsRead(id);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read`, error);
      fetchNotifications(); // Refresh on error to fix state
    }
  }, [fetchNotifications]);

  const markAllAsReadBulk = useCallback(async () => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotificationById = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    // Optimistic UI update
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error(`Failed to delete notification ${id}`, error);
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Auto-polling every 30 seconds for unread count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await getUnreadCount();
        setUnreadCount(res.unread_count);
      } catch (error) {
        console.error("Failed to poll unread count", error);
      }
    };

    fetchCount(); // Initial fetch
    const intervalId = setInterval(fetchCount, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      fetchNotifications,
      markAsReadById,
      markAllAsReadBulk,
      deleteNotificationById
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
