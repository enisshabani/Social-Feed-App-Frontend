import React from 'react';
import { NotificationItem as INotificationItem, NotificationType } from '../types';
import { useNotifications } from '../hooks/useNotifications';

interface Props {
  notification: INotificationItem;
}

const getRelativeTime = (dateString: string): string => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const date = new Date(dateString);
  const now = new Date();
  
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minute');
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hour');
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return rtf.format(diffInDays, 'day');
};

const getMessageForType = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.FOLLOW:
      return 'started following you';
    case NotificationType.LIKE:
      return 'liked your post';
    case NotificationType.REPOST:
      return 'reposted your post';
    case NotificationType.MENTION:
      return 'mentioned you in a post';
    case NotificationType.COMMENT:
      return 'commented on your post';
    default:
      return 'interacted with you';
  }
};

export const NotificationItem: React.FC<Props> = ({ notification }) => {
  const { markAsReadById, deleteNotificationById } = useNotifications();

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      markAsReadById(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationById(notification.id);
  };

  return (
    <div 
      onClick={handleMarkRead}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        backgroundColor: notification.is_read ? '#ffffff' : '#f0f8ff',
        cursor: notification.is_read ? 'default' : 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        transition: 'background-color 0.2s ease'
      }}
    >
      <div>
        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
          <strong>User {notification.actor_id}</strong> {getMessageForType(notification.type)}
        </p>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {getRelativeTime(notification.created_at)}
        </span>
      </div>
      
      <button 
        onClick={handleDelete}
        style={{
          background: 'none',
          border: 'none',
          color: '#aaa',
          cursor: 'pointer',
          padding: '4px',
          fontSize: '14px'
        }}
        title="Delete notification"
      >
        ✕
      </button>
    </div>
  );
};
