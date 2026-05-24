import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, TrendingUp } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { TrendingHashtag } from '../services/post.service';
import CreatePostBox from './CreatePostBox';
import { getLoggedInUser } from './SidebarLeft';

interface SidebarRightProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showComposer?: boolean;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ searchQuery, setSearchQuery, showComposer = true }) => {
  const navigate = useNavigate();
  const [trends, setTrends] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Sync external value into local state (e.g., when Feed.tsx clears search)
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchTrendingTags();
  }, []);

  const currentUser = getLoggedInUser();

  const fetchTrendingTags = async () => {
    try {
      const trending = await PostService.getTrendingHashtags(7);
      setTrends(trending);
    } catch (e) {
      console.error('Gabim gjatë marrjes së hashtags trending:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  return (
    <aside className="sidebar-right">
      {/* Search Input Container */}
      <div className="search-bar-wrapper">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Kërko postime..."
            value={localQuery}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
        </div>
      </div>

      {/* Profile Card */}
      {currentUser && (
        <div className="mastodon-profile-card">
          <div className="profile-card-header">
            <div className="profile-card-avatar">
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-card-info">
              <div className="profile-card-name">@{currentUser.username}</div>
              <div className="profile-card-handle">@{currentUser.username}</div>
            </div>
          </div>
        </div>
      )}

      {/* Composer Box */}
      {showComposer && <CreatePostBox onPostCreated={() => { }} />}

      {/* Trending Box */}
      <div className="trending-box">
        <div className="trending-header">
          <Flame size={20} className="trending-icon" />
          <h3>Çfarë po ndodh</h3>
        </div>

        <div className="trending-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="trending-item skeleton-item">
                <div className="skeleton skeleton-text-sm" style={{ width: '40%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '70%', marginTop: '6px' }}></div>
                <div className="skeleton skeleton-text-sm" style={{ width: '25%', marginTop: '6px' }}></div>
              </div>
            ))
          ) : trends.length === 0 ? (
            <div className="trending-empty">
              Nuk ka asnjë hashtag trending momentalisht.
            </div>
          ) : (
            trends.map((trend) => {
              const totalUses = trend.history.reduce((sum, h) => sum + h.uses, 0);
              const maxUses = Math.max(...trend.history.map(h => h.uses), 1);
              return (
                <div
                  key={trend.id}
                  className="trending-item"
                  onClick={() => navigate(`/hashtag/${trend.name}`)}
                >
                  <div className="trend-meta">Më të përdorur këtë javë</div>
                  <div className="trend-name">#{trend.name}</div>
                  <div className="trend-count">
                    <TrendingUp size={12} style={{ marginRight: '4px' }} />
                    {totalUses} postime në 7 ditët e fundit
                  </div>
                  <div className="trend-dots">
                    {trend.history.slice(-5).map((h, i) => (
                      <span
                        key={i}
                        className="trend-dot"
                        style={{
                          opacity: 0.3 + (h.uses / maxUses) * 0.7,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .sidebar-right {
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          scrollbar-width: none;
          background-color: var(--bg-app);
        }

        .sidebar-right::-webkit-scrollbar {
          display: none;
        }

        .search-bar-wrapper {
          position: sticky;
          top: 0;
          background-color: var(--bg-app);
          padding: 8px 0;
          z-index: 5;
          flex-shrink: 0;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-dimmed);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          background-color: var(--bg-form);
          border: 1px solid transparent;
          border-radius: 9999px;
          color: var(--text-main);
          font-size: 15px;
          outline: none;
          transition: all 0.2s ease;
        }

        .mastodon-profile-card {
          background-color: var(--bg-form);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 16px;
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .profile-card-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          background-color: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
        }

        .profile-card-info {
          display: flex;
          flex-direction: column;
        }

        .profile-card-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-main);
        }

        .profile-card-handle {
          font-size: 14px;
          color: var(--text-dimmed);
        }

        .search-input:focus {
          background-color: var(--bg-app);
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        .search-input:focus + .search-icon {
          color: var(--primary);
        }

        .trending-box {
          background-color: var(--bg-form);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .trending-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .trending-icon {
          color: var(--text-main);
        }

        .trending-header h3 {
          font-size: 18px;
          font-weight: 700;
        }

        .trending-list {
          display: flex;
          flex-direction: column;
          max-height: 55vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .trending-item {
          padding: 14px 20px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid var(--border);
        }

        .trending-item:last-child {
          border-bottom: none;
        }

        .trending-item:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }

        .trend-meta {
          font-size: 12px;
          color: var(--text-dimmed);
        }

        .trend-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
          margin-top: 2px;
        }

        .trend-count {
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .trend-dots {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }

        .trend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .trending-empty {
          padding: 24px;
          text-align: center;
          color: var(--text-dimmed);
          font-size: 14px;
        }

        /* Skeleton States */
        .skeleton-item {
          pointer-events: none;
        }

        .skeleton-text {
          height: 16px;
          border-radius: 4px;
        }

        .skeleton-text-sm {
          height: 12px;
          border-radius: 4px;
        }

        @media (max-width: 990px) {
          .sidebar-right {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
};

export default SidebarRight;
