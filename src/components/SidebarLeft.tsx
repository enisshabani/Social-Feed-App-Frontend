import React from 'react';
import { Home, Hash, Bookmark, LogOut, User, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  const token = localStorage.getItem('token');
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

const SidebarLeft: React.FC<SidebarLeftProps> = ({ currentTab, setCurrentTab, onPostClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
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
    { id: 'home', label: 'Ballina', icon: Home },
    { id: 'explore', label: 'Eksploro', icon: Hash },
    { id: 'bookmarks', label: 'Të ruajtura', icon: Bookmark },
  ] as const;

  return (
    <aside className="sidebar-left">
      <div className="sidebar-left-content">
        {/* App Logo */}
        <div className="sidebar-logo" onClick={() => setCurrentTab('home')}>
          <span className="mastodon-logo" style={{ marginBottom: 0, padding: 0, textAlign: 'left', fontSize: '2.5rem' }}>kaPak</span>
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
                <Icon size={24} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CTA Post Button */}
        {onPostClick && (
          <button className="btn btn-primary cta-post-btn" onClick={onPostClick}>
            <span className="cta-btn-text">Posto</span>
            <Sparkles size={20} className="cta-btn-icon" />
          </button>
        )}

        {/* Profile Link */}
        <button
          className="nav-item profile-nav-item"
          onClick={() => navigate('/profile')}
          title="Profili im"
        >
          <User size={24} className="nav-icon" />
          <span className="nav-label">Profili</span>
        </button>

        {/* Notification Bell */}
        <div style={{ padding: '4px 20px' }}>
          <NotificationBell />
        </div>

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
          margin-bottom: 24px;
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
          text-align: left;
        }

        .nav-item:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .nav-item.active {
          font-weight: 700;
          color: var(--primary);
        }

        .nav-icon {
          transition: transform 0.2s ease;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.15);
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

          .sidebar-logo, .cta-post-btn, .sidebar-user-card {
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
