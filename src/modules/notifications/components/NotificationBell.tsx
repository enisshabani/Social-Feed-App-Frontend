import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from './NotificationList';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        className="nav-item"
        style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', width: 'max-content' }}
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
        <span className="nav-label">Njoftime</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '380px',
          maxHeight: '480px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-form)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          borderRadius: 'var(--radius-md)',
          zIndex: 1000,
          marginTop: '8px',
        }}>
          <NotificationList />
        </div>
      )}
    </div>
  );
};
