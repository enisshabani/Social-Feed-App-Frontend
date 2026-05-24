import React from 'react';
import { Home, Hash, Bookmark, LogOut, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationBell } from '../modules/notifications/components/NotificationBell';

interface SidebarLeftProps {
  currentTab: 'home' | 'explore' | 'bookmarks';
  setCurrentTab: (tab: 'home' | 'explore' | 'bookmarks') => void;
  onPostClick?: () => void;
}

const NAV_ROUTES: Record<'home' | 'explore' | 'bookmarks', string> = {
  home: '/feed',
  explore: '/search',
  bookmarks: '/feed?tab=bookmarks',
};

// Client-side JWT decoder to fetch details of logged-in user
export const getLoggedInUser = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Decode base64 URL safe
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.user_id || payload.sub,
      username: payload.username || 'user',
      tenant_id: payload.tenant_id || 'default',
      role: payload.role || 'user'
    };
  } catch (e) {
    return null;
  }
};

const SidebarLeft: React.FC<SidebarLeftProps> = ({ currentTab, setCurrentTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const user = getLoggedInUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const resolveActiveTab = (): 'home' | 'explore' | 'bookmarks' => {
    if (location.pathname === '/search') return 'explore';
    if (location.pathname === '/feed') {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'bookmarks') return 'bookmarks';
    }
    return currentTab;
  };

  const activeTab = resolveActiveTab();

  const handleNavClick = (tab: 'home' | 'explore' | 'bookmarks') => {
    setCurrentTab(tab);
    navigate(NAV_ROUTES[tab]);
  };

  const navItems = [
    { id: 'home', label: t('feed_home'), icon: Home },
    { id: 'explore', label: t('feed_explore'), icon: Hash },
    { id: 'bookmarks', label: t('feed_bookmarks'), icon: Bookmark },
  ] as const;

  return (
    <aside className="sidebar-left">
      <div className="sidebar-left-content">
        {/* App Logo */}
        <div className="sidebar-logo" onClick={() => setCurrentTab('home')}>
          <span className="mastodon-logo" style={{ marginBottom: 0, padding: 0, textAlign: 'left', fontSize: '1.8rem', color: 'var(--text-main)' }}>kaPak</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon-box">
                  <Icon size={24} strokeWidth={2.3} className="nav-icon" />
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-language-switch" title="Change language">
          <button
            type="button"
            className={`language-chip ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`language-chip ${language === 'sq' ? 'active' : ''}`}
            onClick={() => setLanguage('sq')}
          >
            SQ
          </button>
        </div>



        {/* Profile Link */}
        <button
          className="nav-item profile-nav-item"
          onClick={() => navigate('/profile')}
          title="Profili im"
        >
          <span className="nav-icon-box">
            <User size={24} strokeWidth={2.3} className="nav-icon" />
          </span>
          <span className="nav-label">Profili</span>
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Card at bottom */}
        {user && (
          <div className="sidebar-user-card" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div className="user-info-wrapper">
              <div className="user-avatar-placeholder">
                <User size={20} />
              </div>
              <div className="user-details">
                <div className="user-display-name">@{user.username}</div>
                <div className="user-tenant-badge">
                  <span className="badge badge-tenant">{user.tenant_id}</span>
                </div>
              </div>
            </div>
            <button className="btn-icon logout-btn" title="Dil" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .sidebar-left {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: none;
          background-color: var(--bg-app);
        }

        .sidebar-left-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          margin-bottom: 20px;
          width: max-content;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 14px;
        }

        .sidebar-language-switch {
          display: inline-flex;
          width: max-content;
          gap: 4px;
          padding: 4px;
          margin: 0 0 20px 16px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.03);
        }

        .language-chip {
          border: none;
          border-radius: 999px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          height: 28px;
          min-width: 38px;
        }

        .language-chip.active {
          color: white;
          background: var(--primary);
        }

        .language-chip:hover:not(.active) {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.08);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 19px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          width: max-content;
          min-height: 50px;
          text-align: left;
          box-sizing: border-box;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .nav-item.active {
          font-weight: 700;
          color: var(--primary);
        }

        .nav-icon {
          display: block;
          flex-shrink: 0;
        }

        .nav-icon-box {
          position: relative;
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 24px;
          transition: transform 0.2s ease;
        }

        .nav-item:hover .nav-icon-box {
          transform: scale(1.08);
        }

        .notification-badge {
          position: absolute;
          top: -7px;
          right: -9px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 9999px;
          background: var(--primary);
          color: #fff;
          border: 2px solid var(--bg-app);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          box-sizing: border-box;
          pointer-events: none;
        }

        .cta-post-btn {
          width: 90%;
          margin-top: 8px;
          font-size: 16px;
          padding: 14px 24px;
        }

        .cta-btn-icon {
          display: none;
        }

        .sidebar-user-card {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border-radius: 9999px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          transition: background-color 0.2s ease;
        }

        .sidebar-user-card:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }

        .user-info-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .user-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-round);
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-display-name {
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-tenant-badge {
          margin-top: 2px;
        }

        .logout-btn {
          color: var(--text-dimmed);
        }

        .logout-btn:hover {
          color: var(--error);
          background-color: var(--error-bg);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1095px) {
          .sidebar-left {
            align-items: center;
            padding: 16px 8px;
          }

          .logo-text, .nav-label, .cta-btn-text, .user-details {
            display: none;
          }

          .sidebar-language-switch {
            margin-left: 0;
          }

          .language-chip {
            min-width: 30px;
            font-size: 11px;
          }

          .sidebar-logo {
            padding: 12px 0;
            margin-bottom: 24px;
          }

          .nav-item {
            width: 50px;
            height: 50px;
            padding: 0;
            justify-content: center;
            border-radius: var(--radius-round);
          }

          .cta-post-btn {
            width: 50px;
            height: 50px;
            padding: 0;
            border-radius: var(--radius-round);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cta-btn-icon {
            display: block;
          }

          .sidebar-user-card {
            background: transparent;
            border: none;
            padding: 0;
            justify-content: center;
            border-radius: 0;
          }

          .logout-btn {
            display: none;
          }
        }

        @media (max-width: 688px) {
          .sidebar-left {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: rgba(6, 9, 19, 0.9);
            backdrop-filter: var(--glass-blur);
            -webkit-backdrop-filter: var(--glass-blur);
            border-top: 1px solid var(--border);
            z-index: 100;
            flex-direction: row;
            padding: 0 16px;
            justify-content: space-around;
            align-items: center;
          }

          .sidebar-left-content {
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }

          .sidebar-logo, .cta-post-btn, .sidebar-user-card, .sidebar-language-switch {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;
            margin-bottom: 0;
            width: 100%;
            justify-content: space-around;
          }

          .nav-item {
            margin: 0;
            color: var(--text-muted);
          }

          .nav-item.active {
            color: var(--primary);
            background: transparent;
          }
        }
      `}</style>
    </aside>
  );
};

export default SidebarLeft;

