import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationItem as INotificationItem } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { UserPlus, Heart, Repeat, AtSign, MessageCircle, Bell } from 'lucide-react';
import SafeAvatar from '../../../components/SafeAvatar';

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

const getMessageForType = (type: string): string => {
  switch (type) {
    case 'FOLLOW':
      return 'started following you';
    case 'LIKE':
      return 'liked your post';
    case 'REPOST':
      return 'reposted your post';
    case 'MENTION':
      return 'mentioned you in a post';
    case 'COMMENT':
      return 'commented on your post';
    default:
      return 'interacted with you';
  }
};

export const NotificationItem: React.FC<Props> = ({ notification }) => {
  const { markAsReadById, deleteNotificationById } = useNotifications();
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'FOLLOW':
        return <UserPlus size={18} color="var(--primary)" />;
      case 'LIKE':
        return <Heart size={18} color="var(--error)" />;
      case 'REPOST':
        return <Repeat size={18} color="var(--repost)" />;
      case 'MENTION':
        return <AtSign size={18} color="var(--primary-light)" />;
      case 'COMMENT':
        return <MessageCircle size={18} color="var(--text-main)" />;
      default:
        return <Bell size={18} color="var(--text-muted)" />;
    }
  };

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

  const handleActorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.actor?.username) {
      navigate(`/profile/${encodeURIComponent(notification.actor.username)}`);
    }
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
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#eef2ff',
            color: '#6364ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <SafeAvatar
              src={notification.actor?.avatar_url}
              alt={notification.actor?.username || `User ${notification.actor_id}`}
              fallbackText={notification.actor?.username}
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onClick={handleActorClick}
            />
          </div>
          <span style={{
            position: 'absolute',
            right: -4,
            bottom: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {getIcon()}
          </span>
        </div>
        <div>
          <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>
            <strong onClick={handleActorClick} style={{ cursor: 'pointer' }}>{notification.actor?.display_name || notification.actor?.username || `User ${notification.actor_id}`}</strong> {getMessageForType(notification.type)}
          </p>
          <span style={{ fontSize: '12px', color: '#888' }}>
            {getRelativeTime(notification.created_at)}
          </span>
        </div>
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
