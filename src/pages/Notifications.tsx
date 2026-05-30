import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { useNotifications } from '../modules/notifications/hooks/useNotifications';
import type { NotificationItem as INotificationItem } from '../modules/notifications/types';
import { UserPlus, Heart, Repeat2, AtSign, MessageCircle, Bell, Check, Trash2, Settings, X } from 'lucide-react';
import { followUser, unfollowUser, checkIsFollowing, getPendingFollowBacks } from '../modules/follows/api/followsApi';
import type { FollowResponse } from '../modules/follows/types';
import notificationsApi from '../modules/notifications/api/notificationsApi';
import type { NotificationPreference } from '../modules/notifications/types';
import SafeAvatar from '../components/SafeAvatar';
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

const NotificationRow: React.FC<{ notif: INotificationItem, highlightUnread: boolean }> = ({ notif, highlightUnread }) => {
  const navigate = useNavigate();
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
    if (notif.type === 'FOLLOW' && notif.actor?.username) {
      navigate(`/profile/${encodeURIComponent(notif.actor.username)}`);
    }
  };

  const actorName = notif.actor?.display_name || notif.actor?.username || `User ${notif.actor_id}`;
  const actorHandle = notif.actor?.username ? `@${notif.actor.username}` : '';

  return (
    <div
      className={`notif-row ${!notif.is_read ? 'notif-unread' : ''}`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notif.is_read && highlightUnread && <span className="notif-unread-dot" />}

      {/* Icon */}
      <div className="notif-type-icon">
        <TypeIcon type={notif.type} />
      </div>

      {/* Actor Avatar */}
      <div className="notif-avatar">
        <SafeAvatar
          src={notif.actor?.avatar_url}
          alt={actorName}
          fallbackText={actorName}
          className="notif-avatar-placeholder"
          imgClassName="notif-avatar-img"
        />
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

const FollowBackReminderRow: React.FC<{ follow: FollowResponse }> = ({ follow }) => {
  const navigate = useNavigate();
  const targetUser = follow.followee;
  const targetName = targetUser?.display_name || targetUser?.username || `User ${follow.followee_id}`;
  const targetHandle = targetUser?.username ? `@${targetUser.username}` : '';

  const handleClick = () => {
    if (targetUser?.username) {
      navigate(`/profile/${encodeURIComponent(targetUser.username)}`);
    }
  };

  return (
    <div className="notif-row follow-reminder-row" onClick={handleClick}>
      <div className="notif-type-icon">
        <UserPlus size={20} color="var(--primary)" />
      </div>

      <div className="notif-avatar">
        <SafeAvatar
          src={targetUser?.avatar_url}
          alt={targetName}
          fallbackText={targetName}
          className="notif-avatar-placeholder"
          imgClassName="notif-avatar-img"
        />
      </div>

      <div className="notif-content">
        <div className="notif-text">
          <span className="notif-actor-name">{targetName}</span>
          {' '}
          <span className="notif-action">ende nuk ta ka kthyer follow-in</span>
          {targetHandle && <span className="notif-handle"> · {targetHandle}</span>}
        </div>
        <div className="notif-meta">
          <span className="notif-time">Reminder deri sa te ndjek mbrapsht</span>
        </div>
      </div>
    </div>
  );
};

type TabType = 'all' | 'mentions';
type NotificationRuleAction = 'accept' | 'ignore';
type ActivePreferenceKey = 'filter_not_following' | 'filter_not_followed_by' | 'filter_new_accounts';

const Notifications: React.FC = () => {
  const { notifications, isLoading, fetchNotifications, markAllAsReadBulk, clearAllNotifications, unreadCount } = useNotifications();
  const [currentFeedTab, setCurrentFeedTab] = useState<'home' | 'explore' | 'bookmarks'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [followBackReminders, setFollowBackReminders] = useState<FollowResponse[]>([]);

  useEffect(() => {
    fetchNotifications();
    notificationsApi.getPreferences().then(setPreferences).catch(console.error);
  }, [fetchNotifications]);

  useEffect(() => {
    const fetchFollowBackReminders = () => {
      getPendingFollowBacks()
        .then(setFollowBackReminders)
        .catch(error => console.error('Failed to fetch follow-back reminders', error));
    };

    fetchFollowBackReminders();
    const intervalId = window.setInterval(fetchFollowBackReminders, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const updatePreferences = async (nextPreferences: NotificationPreference) => {
    if (!preferences) return;
    setPreferences(nextPreferences);
    try {
      await notificationsApi.updatePreferences(nextPreferences);
    } catch (e) {
      console.error(e);
      setPreferences(preferences);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreference) => {
    if (!preferences) return;
    updatePreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleRuleActionChange = async (key: ActivePreferenceKey, action: NotificationRuleAction) => {
    if (!preferences) return;
    updatePreferences({ ...preferences, [key]: action === 'ignore' });
  };

  const handleClearNotifications = async () => {
    if (notifications.length === 0) return;
    await clearAllNotifications();
  };

  const filteredNotifications = activeTab === 'mentions'
    ? notifications.filter(n => n.type === 'MENTION' || n.type === 'COMMENT')
    : notifications;
  const visibleFollowBackReminders = activeTab === 'all' ? followBackReminders : [];

  const manageNotificationRules: Array<{
    key: ActivePreferenceKey;
    title: string;
    description: string;
  }> = [
    {
      key: 'filter_not_following',
      title: "Njerëzit që nuk i ndjek",
      description: 'Derisa t’i pranosh vetë.',
    },
    {
      key: 'filter_not_followed_by',
      title: 'Njerëzit që nuk të ndjekin',
      description: 'Përfshin llogaritë që nuk janë ndjekësit e tu.',
    },
    {
      key: 'filter_new_accounts',
      title: 'Llogaritë e reja',
      description: 'Të krijuara së fundmi.',
    },
  ];

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
            <button 
              className="notif-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              title="Cilësimet e njoftimeve"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Tabs */}
          {preferences?.display_all_categories !== false && (
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
          )}
        </div>

        {/* Body */}
        <div className="notif-list">
          {isLoading && notifications.length === 0 && visibleFollowBackReminders.length === 0 ? (
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
          ) : filteredNotifications.length === 0 && visibleFollowBackReminders.length === 0 ? (
            <div className="notif-empty">
              <Bell size={40} style={{ color: 'var(--text-dimmed)', marginBottom: '12px' }} />
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '18px' }}>Asnjë njoftim</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>
                {activeTab === 'mentions' ? 'Asnjë përmendëse ende.' : 'Do t\'ju njoftojmë kur të ndodhë diçka.'}
              </p>
            </div>
          ) : (
            <>
              {visibleFollowBackReminders.map(follow => (
                <FollowBackReminderRow key={follow.id} follow={follow} />
              ))}
              {filteredNotifications.map(notif => (
                <NotificationRow key={notif.id} notif={notif} highlightUnread={preferences?.highlight_unread ?? true} />
              ))}
            </>
          )}
        </div>
      </div>

      {isSettingsOpen && preferences && (
        <div className="notif-settings-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="notif-settings-modal" onClick={e => e.stopPropagation()}>
            <div className="notif-settings-header">
              <h3>Cilësimet e njoftimeve</h3>
              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="notif-settings-body">
              <button
                className="clear-notifications-btn"
                onClick={handleClearNotifications}
                disabled={notifications.length === 0}
              >
                <Trash2 size={16} />
                <span>Fshi te gjitha njoftimet</span>
              </button>
              <div className="settings-section">
                <h4>Menaxho njoftimet nga...</h4>
                {manageNotificationRules.map(rule => (
                  <div className="notification-rule-row" key={rule.key}>
                    <div className="rule-copy">
                      <span>{rule.title}</span>
                      <small>{rule.description}</small>
                    </div>
                    <select
                      className="rule-select"
                      value={preferences[rule.key] ? 'ignore' : 'accept'}
                      onChange={(event) => handleRuleActionChange(rule.key, event.target.value as NotificationRuleAction)}
                    >
                      <option value="accept">Accept</option>
                      <option value="ignore">Ignore</option>
                    </select>
                  </div>
                ))}

                <div className="notification-rule-row muted">
                  <div className="rule-copy">
                    <span>Permendjet private te padeshiruara</span>
                    <small>Do lidhet kur te kete njoftime private ne backend.</small>
                  </div>
                  <select className="rule-select" value="accept" disabled>
                    <option value="accept">Accept</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </div>

                <div className="notification-rule-row muted">
                  <div className="rule-copy">
                    <span>Llogarite e moderuara</span>
                    <small>Do lidhet kur backend te ruaje status moderimi per user-at.</small>
                  </div>
                  <select className="rule-select" value="accept" disabled>
                    <option value="accept">Accept</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </div>
                
                <label className="settings-toggle">
                  <div className="toggle-info">
                    <span>Njerëzit që nuk të ndjekin</span>
                    <small>Filtro njoftimet nga llogaritë që nuk janë ndjekësit e tu.</small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.filter_not_following} 
                    onChange={() => handleTogglePreference('filter_not_following')} 
                  />
                  <span className="slider"></span>
                </label>

                <label className="settings-toggle">
                  <div className="toggle-info">
                    <span>Njerëzit që nuk i ndjek</span>
                    <small>Filtro njoftimet nga llogaritë që nuk i ndjek.</small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.filter_not_followed_by} 
                    onChange={() => handleTogglePreference('filter_not_followed_by')} 
                  />
                  <span className="slider"></span>
                </label>

                <label className="settings-toggle">
                  <div className="toggle-info">
                    <span>Llogaritë e reja</span>
                    <small>Filtro njoftimet nga llogaritë e krijuara nesër/së fundmi.</small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.filter_new_accounts} 
                    onChange={() => handleTogglePreference('filter_new_accounts')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-section">
                <h4>Njoftimet e palexuara</h4>
                <label className="settings-toggle">
                  <div className="toggle-info">
                    <span>Thekso njoftimet e palexuara</span>
                    <small>Trego një pikë për të dalluar njoftimet e palexuara.</small>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.highlight_unread} 
                    onChange={() => handleTogglePreference('highlight_unread')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-section">
                <h4>Shiriti i shpejtë i filtrave</h4>
                <label className="settings-toggle">
                  <div className="toggle-info">
                    <span>Shfaq të gjitha kategoritë</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={preferences.display_all_categories} 
                    onChange={() => handleTogglePreference('display_all_categories')} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

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

        .follow-reminder-row {
          background: rgba(99, 100, 255, 0.06);
        }

        .follow-reminder-row:hover {
          background: rgba(99, 100, 255, 0.1);
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

        .feed-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          gap: 8px;
        }

        .notif-settings-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
          margin-left: auto;
        }

        .notif-settings-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
        }

        /* ---- Settings Modal ---- */
        .notif-settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .notif-settings-modal {
          background: var(--bg-panel-solid, #15202b);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
        }

        .notif-settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg-panel-solid, #15202b);
          z-index: 2;
        }

        .notif-settings-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
        }

        .notif-settings-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .clear-notifications-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border: none;
          border-bottom: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-family);
          font-size: 15px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }

        .clear-notifications-btn:hover:not(:disabled) {
          color: var(--text-main);
        }

        .clear-notifications-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .settings-section h4 {
          margin: 0 0 16px 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notif-settings-body .settings-section:first-of-type > .settings-toggle {
          display: none;
        }

        .notification-rule-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          margin-bottom: 18px;
        }

        .notification-rule-row:last-child {
          margin-bottom: 0;
        }

        .notification-rule-row.muted {
          opacity: 0.55;
        }

        .rule-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .rule-copy span {
          color: var(--text-main);
          font-size: 15px;
          font-weight: 800;
        }

        .rule-copy small {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.35;
        }

        .rule-select {
          min-width: 112px;
          height: 38px;
          padding: 0 34px 0 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--primary);
          color: #fff;
          font-family: var(--font-family);
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .rule-select:hover:not(:disabled),
        .rule-select:focus {
          border-color: rgba(255, 255, 255, 0.28);
          outline: none;
        }

        .rule-select:disabled {
          background: transparent;
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .settings-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          margin-bottom: 16px;
        }
        
        .settings-toggle:last-child {
          margin-bottom: 0;
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding-right: 16px;
        }

        .toggle-info span {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
        }

        .toggle-info small {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Custom Checkbox/Toggle Switch */
        .settings-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: relative;
          cursor: pointer;
          width: 44px;
          height: 24px;
          background-color: var(--border);
          border-radius: 24px;
          transition: .3s;
          flex-shrink: 0;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: .3s;
        }

        .settings-toggle input:checked + .slider {
          background-color: var(--primary);
        }

        .settings-toggle input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </MainLayout>
  );
};

export default Notifications;
