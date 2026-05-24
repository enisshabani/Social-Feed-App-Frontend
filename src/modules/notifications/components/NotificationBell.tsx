import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../../../context/LanguageContext';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = location.pathname === '/notifications';

  return (
    <button
      className={`nav-item ${isActive ? 'active' : ''}`}
      onClick={() => navigate('/notifications')}
      title={t("nav_notifications")}
    >
      <span className="nav-icon-box" style={{ position: 'relative' }}>
        <Bell size={24} strokeWidth={2.3} className="nav-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      <span className="nav-label" style={isActive ? { fontWeight: 700 } : {}}>{t("nav_notifications")}</span>
    </button>
  );
};
