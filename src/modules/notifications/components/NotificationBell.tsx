import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationList } from './NotificationList';

export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(prev => !prev);

  // Close dropdown when clicking outside
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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={toggleDropdown}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          fontSize: '24px'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '350px',
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          zIndex: 1000,
          marginTop: '8px'
        }}>
          <NotificationList />
        </div>
      )}
    </div>
  );
};
