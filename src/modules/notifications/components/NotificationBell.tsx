import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === '/notifications';

  return (
    <div
      className={`nav-item ${isActive ? 'active' : ''}`}
      onClick={() => navigate('/notifications')}
      style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', width: 'max-content', cursor: 'pointer' }}
      title="Njoftime"
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Bell size={24} className="nav-icon" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-6px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <span className="nav-label" style={isActive ? { fontWeight: 700 } : {}}>Njoftime</span>
    </div>
  );
};
