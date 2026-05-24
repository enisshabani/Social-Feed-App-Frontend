import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';
import { useNotifications } from '../modules/notifications/hooks/useNotifications';
import type { NotificationItem as INotificationItem } from '../modules/notifications/types';
import { UserPlus, Heart, Repeat2, AtSign, MessageCircle, Bell, Check, Trash2, User } from 'lucide-react';
import { followUser, unfollowUser, checkIsFollowing } from '../modules/follows/api/followsApi';
import '../styles/globals.css';

const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  return date.toLocaleDateString();
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'FOLLOW': return 'filloi t\'ju ndjekë';
    case 'LIKE': return 'i pëlqeu postimin tuaj';
    case 'REPOST': return 'ripostoi postimin tuaj';
    case 'MENTION': return 'ju përmendi në një postim';
    case 'COMMENT': return 'komentoi postimin tuaj';
    default: return 'ndërveproi me ju';
  }
};

const typeColors: Record<string, string> = {
  FOLLOW: 'var(--primary)',
  LIKE: '#f91880',
  REPOST: '#00ba7c',
  MENTION: '#1d9bf0',
  COMMENT: 'var(--text-muted)',
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const color = typeColors[type] || 'var(--text-muted)';
  switch (type) {
    case 'FOLLOW': return <UserPlus size={20} color={color} />;
    case 'LIKE': return <Heart size={20} color={color} />;
    case 'REPOST': return <Repeat2 size={20} color={color} />;
    case 'MENTION': return <AtSign size={20} color={color} />;
    case 'COMMENT': return <MessageCircle size={20} color={color} />;
    default: return <Bell size={20} color={color} />;
  }
};

const NotificationRow: React.FC<{ notif: INotificationItem }> = ({ notif }) => {
  const { markAsReadById, deleteNotificationById } = useNotifications();
  const [followState, setFollowState] = useState<'loading' | 'following' | 'not_following'>('loading');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (notif.type === 'FOLLOW' && notif.actor_id) {
      checkIsFollowing(notif.actor_id)
        .then(data => setFollowState(data.is_following ? 'following' : 'not_following'))
        .catch(() => setFollowState('not_following'));
    }
  }, [notif.type, notif.actor_id]);

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (followState === 'following') {
        await unfollowUser(notif.actor_id);
        setFollowState('not_following');
      } else {
        await followUser(notif.actor_id);
        setFollowState('following');
      }
    } catch (err) {
      console.error('Follow action failed', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleClick = () => {
    if (!notif.is_read) markAsReadById(notif.id);
  };

  const actorName = notif.actor?.display_name || notif.actor?.username || `User ${notif.actor_id}`;
  const actorHandle = notif.actor?.username ? `@${notif.actor.username}` : '';

  return (
    <div
      className={`notif-row ${!notif.is_read ? 'notif-unread' : ''}`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notif.is_read && <span className="notif-unread-dot" />}

      {/* Icon */}
      <div className="notif-type-icon">
        <TypeIcon type={notif.type} />
      </div>

      {/* Actor Avatar */}
      <div className="notif-avatar">
        {notif.actor?.avatar_url ? (
          <img src={notif.actor.avatar_url} alt={actorName} className="notif-avatar-img" />
        ) : (
          <div className="notif-avatar-placeholder">
            <User size={20} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="notif-content">
        <div className="notif-text">
          <span className="notif-actor-name">{actorName}</span>
          {' '}
          <span className="notif-action">{getTypeLabel(notif.type)}</span>
          {actorHandle && <span className="notif-handle"> · {actorHandle}</span>}
        </div>
        <div className="notif-meta">
          <span className="notif-time">{getRelativeTime(notif.created_at)}</span>
        </div>
      </div>

      {/* Follow back button */}
      {notif.type === 'FOLLOW' && followState !== 'loading' && (
        <button
          className={`notif-follow-btn ${followState === 'following' ? 'following' : ''}`}
          onClick={handleFollowBack}
          disabled={followLoading}
        >
          {followState === 'following' ? 'Duke ndjekur' : 'Ndiqe'}
        </button>
      )}

      {/* Delete button */}
      <button
        className="notif-delete-btn"
        onClick={(e) => { e.stopPropagation(); deleteNotificationById(notif.id); }}
        title="Fshi"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

type TabType = 'all' | 'mentions';

const Notifications: React.FC = () => {
  const { notifications, isLoading, fetchNotifications, markAllAsReadBulk, unreadCount } = useNotifications();
  const [currentFeedTab, setCurrentFeedTab] = useState<'home' | 'explore' | 'bookmarks'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = activeTab === 'mentions'
    ? notifications.filter(n => n.type === 'MENTION' || n.type === 'COMMENT')
    : notifications;

  return (
    <MainLayout
      currentTab={currentFeedTab}
      setCurrentTab={setCurrentFeedTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <div className="notif-page">

        {/* Sticky Header */}
        <div className="feed-header">
          <div className="feed-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} style={{ color: 'var(--primary)' }} />
              <h2 className="feed-title">Njoftimet</h2>
            </div>
            {unreadCount > 0 && (
              <button
                className="notif-mark-all-btn"
                onClick={() => markAllAsReadBulk()}
                title="Shëno të gjitha si të lexuara"
              >
                <Check size={16} />
                <span>Shëno të gjitha</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="notif-tabs">
            <button
              className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Të gjitha
            </button>
            <button
              className={`notif-tab ${activeTab === 'mentions' ? 'active' : ''}`}
              onClick={() => setActiveTab('mentions')}
            >
              Përmendjet
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="notif-list">
          {isLoading && notifications.length === 0 ? (
            /* Skeleton */
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="notif-skeleton">
                <div className="skeleton notif-skeleton-icon" />
                <div className="skeleton notif-skeleton-avatar" />
                <div className="notif-skeleton-lines">
                  <div className="skeleton notif-skeleton-line" style={{ width: '60%' }} />
                  <div className="skeleton notif-skeleton-line" style={{ width: '30%', marginTop: '6px' }} />
                </div>
              </div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={40} style={{ color: 'var(--text-dimmed)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '18px' }}>Asnjë njoftim</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
                {activeTab === 'mentions' ? 'Asnjë përmendëse ende.' : 'Do t\'ju njoftojmë kur të ndodhë diçka.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <NotificationRow key={notif.id} notif={notif} />
            ))
          )}
        </div>
      </div>

      <style>{`
        .notif-page {
          min-height: 100vh;
        }

        /* ---- Notification list ---- */
        .notif-list {
          display: flex;
          flex-direction: column;
        }

        /* ---- Row ---- */
        .notif-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.15s ease;
          position: relative;
        }

        .notif-row:hover {
          background-color: rgba(255, 255, 255, 0.025);
        }

        .notif-unread {
          background-color: rgba(99, 100, 255, 0.04);
        }

        .notif-unread-dot {
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--primary);
          flex-shrink: 0;
        }

        /* ---- Type icon ---- */
        .notif-type-icon {
          flex-shrink: 0;
          margin-top: 2px;
          width: 24px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        /* ---- Avatar ---- */
        .notif-avatar {
          flex-shrink: 0;
        }

        .notif-avatar-img {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .notif-avatar-placeholder {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ---- Content ---- */
        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-text {
          font-size: 15px;
          color: var(--text-main);
          line-height: 1.4;
        }

        .notif-actor-name {
          font-weight: 700;
        }

        .notif-action {
          color: var(--text-muted);
        }

        .notif-handle {
          color: var(--text-dimmed);
          font-size: 13px;
        }

        .notif-meta {
          margin-top: 4px;
        }

        .notif-time {
          font-size: 13px;
          color: var(--text-dimmed);
        }

        /* ---- Follow back button ---- */
        .notif-follow-btn {
          flex-shrink: 0;
          padding: 7px 18px;
          border-radius: 9999px;
          border: 1px solid var(--primary);
          background: var(--primary);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .notif-follow-btn.following {
          background: transparent;
          color: var(--text-muted);
          border-color: var(--border);
        }

        .notif-follow-btn:hover:not(:disabled) {
          opacity: 0.85;
        }

        .notif-follow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ---- Delete button ---- */
        .notif-delete-btn {
          flex-shrink: 0;
          background: none;
          border: none;
          color: var(--text-dimmed);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.15s ease;
        }

        .notif-row:hover .notif-delete-btn {
          opacity: 1;
        }

        .notif-delete-btn:hover {
          background-color: rgba(255, 59, 48, 0.12);
          color: #ff3b30;
        }

        /* ---- Mark all button ---- */
        .notif-mark-all-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          font-family: var(--font-family);
          transition: all 0.2s ease;
        }

        .notif-mark-all-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        /* ---- Tabs ---- */
        .notif-tabs {
          display: flex;
          border-top: 1px solid var(--border);
        }

        .notif-tab {
          flex: 1;
          padding: 14px 0;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: var(--font-family);
          position: relative;
          transition: color 0.15s ease;
        }

        .notif-tab:hover {
          background-color: rgba(255, 255, 255, 0.03);
          color: var(--text-main);
        }

        .notif-tab.active {
          color: var(--text-main);
          font-weight: 700;
        }

        .notif-tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: var(--primary);
          border-radius: 3px 3px 0 0;
        }

        /* ---- Empty state ---- */
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
        }

        /* ---- Skeleton ---- */
        .notif-skeleton {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .notif-skeleton-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notif-skeleton-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notif-skeleton-lines {
          flex: 1;
        }

        .notif-skeleton-line {
          height: 14px;
          border-radius: 6px;
        }

        /* ---- Header top row ---- */
        .feed-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
        }
      `}</style>
    </MainLayout>
  );
};

export default Notifications;
