import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export const NotificationList: React.FC = () => {
  const { notifications, isLoading, fetchNotifications, markAllAsReadBulk, unreadCount } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eaeaea',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 1
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadBulk()}
            style={{
              background: 'none',
              border: 'none',
              color: '#1da1f2',
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && notifications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>
    </div>
  );
};
