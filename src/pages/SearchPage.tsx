import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, Hash, MessageSquare } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import SearchBar from '../components/search/SearchBar';
import PostItem from '../components/PostItem';
import { SearchService } from '../services/search.service';
import type { SearchPostResult } from '../services/search.service';
import type { UserPublic, TrendingHashtag } from '../services/post.service';

type SearchTab = 'posts' | 'users' | 'hashtags';

const LIMIT = 20;

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [searchQuery, setSearchQuery] = useState(urlQuery);

  // Sync when URL changes (e.g., SidebarRight Enter navigates here)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setSearchQuery(q);
  }, [searchParams]);

  // Results per tab
  const [posts, setPosts] = useState<SearchPostResult[]>([]);
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([]);

  // Pagination per tab
  const [postsTotal, setPostsTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [hashtagsTotal, setHashtagsTotal] = useState(0);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Track what's been loaded
  const hasSearched = searchQuery.trim().length > 0;

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      setSearchParams({});
    }
  }, [setSearchParams]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchQuery('');
    setSearchParams({});
    setPosts([]);
    setUsers([]);
    setHashtags([]);
  }, [setSearchParams]);

  // Fetch results when query or tab changes
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        if (activeTab === 'posts') {
          const res = await SearchService.searchPosts(searchQuery, 0, LIMIT, true);
          setPosts(res.items);
          setPostsTotal(res.total);
          setUsers([]);
          setHashtags([]);
        } else if (activeTab === 'users') {
          const res = await SearchService.searchUsers(searchQuery, 0, LIMIT);
          setUsers(res.items);
          setUsersTotal(res.total);
          setPosts([]);
          setHashtags([]);
        } else {
          const res = await SearchService.searchHashtags(searchQuery, 0, LIMIT);
          setHashtags(res.items);
          setHashtagsTotal(res.total);
          setPosts([]);
          setUsers([]);
        }
      } catch (err: any) {
        setError('Gabim gjatë kërkimit. Provoni përsëri.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, activeTab]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      if (activeTab === 'posts') {
        const res = await SearchService.searchPosts(searchQuery, posts.length, LIMIT, true);
        setPosts((prev) => [...prev, ...res.items]);
        setPostsTotal(res.total);
      } else if (activeTab === 'users') {
        const res = await SearchService.searchUsers(searchQuery, users.length, LIMIT);
        setUsers((prev) => [...prev, ...res.items]);
        setUsersTotal(res.total);
      } else {
        const res = await SearchService.searchHashtags(searchQuery, hashtags.length, LIMIT);
        setHashtags((prev) => [...prev, ...res.items]);
        setHashtagsTotal(res.total);
      }
    } catch {
      setError('Gabim gjatë ngarkimit të më shumë rezultateve.');
    } finally {
      setLoadingMore(false);
    }
  };

  const tabs: { key: SearchTab; label: string; icon: React.ReactNode }[] = [
    { key: 'posts', label: 'Postime', icon: <MessageSquare size={16} /> },
    { key: 'users', label: 'Përdorues', icon: <User size={16} /> },
    { key: 'hashtags', label: 'Hashtags', icon: <Hash size={16} /> },
  ];

  const hasMore =
    activeTab === 'posts'
      ? posts.length < postsTotal
      : activeTab === 'users'
        ? users.length < usersTotal
        : hashtags.length < hashtagsTotal;

  return (
    <MainLayout
      currentTab="explore"
      setCurrentTab={() => {}}
      searchQuery=""
      setSearchQuery={() => {}}
    >
      <div className="search-page">
        <SearchBar
          value={query}
          onChange={handleSearch}
          onClear={handleClear}
          debounceMs={800}
        />

        {/* Tabs */}
        <div className="search-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`search-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="search-results">
          {!hasSearched ? (
            <div className="search-empty">
              <Search size={48} className="search-empty-icon" />
              <h3>Kërko në KaPak</h3>
              <p>Gjej postime, përdorues dhe hashtags.</p>
            </div>
          ) : loading ? (
            <div className="search-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="search-skeleton">
                  <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '100%', marginTop: '8px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '8px' }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="search-error">{error}</div>
          ) : activeTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="search-empty">
                <MessageSquare size={32} className="search-empty-icon" />
                <p>Asnjë postim për "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="search-meta">{postsTotal} postime</div>
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} onPostUpdated={() => {}} matchContext={post.match_context} highlightQuery={searchQuery} />
                ))}
              </>
            )
          ) : activeTab === 'users' ? (
            users.length === 0 ? (
              <div className="search-empty">
                <User size={32} className="search-empty-icon" />
                <p>Asnjë përdorues për "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="search-meta">{usersTotal} përdorues</div>
                {users.map((u) => (
                  <div key={u.id} className="user-result-card">
                    <div className="user-result-avatar">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="user-result-info">
                      <span className="user-result-name">{u.display_name || u.username}</span>
                      <span className="user-result-username">@{u.username}</span>
                      {u.bio && <span className="user-result-bio">{u.bio}</span>}
                    </div>
                  </div>
                ))}
              </>
            )
          ) : /* hashtags */
            hashtags.length === 0 ? (
              <div className="search-empty">
                <Hash size={32} className="search-empty-icon" />
                <p>Asnjë hashtag për "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <div className="search-meta">{hashtagsTotal} hashtags</div>
                {hashtags.map((h) => (
                  <div
                    key={h.id}
                    className="hashtag-result-card"
                    onClick={() => navigate(`/hashtag/${h.name}`)}
                  >
                    <div className="hashtag-result-icon">#</div>
                    <div className="hashtag-result-info">
                      <span className="hashtag-result-name">#{h.name}</span>
                      <span className="hashtag-result-count">{h.mention_count} postime</span>
                    </div>
                  </div>
                ))}
              </>
            )}

          {/* Load More */}
          {hasSearched && hasMore && !loading && (
            <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Duke ngarkuar...' : 'Ngarko më shumë'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .search-page {
          padding: 16px 0;
        }

        .search-tabs {
          display: flex;
          gap: 0;
          margin-top: 16px;
          border-bottom: 1px solid var(--border);
        }

        .search-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 16px;
          border: none;
          background: none;
          color: var(--text-dimmed);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }

        .search-tab:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.02);
        }

        .search-tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .search-results {
          margin-top: 12px;
        }

        .search-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px;
          text-align: center;
          color: var(--text-dimmed);
        }

        .search-empty-icon {
          color: var(--text-dimmed);
          opacity: 0.4;
          margin-bottom: 16px;
        }

        .search-empty h3 {
          font-size: 18px;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .search-empty p {
          font-size: 14px;
        }

        .search-meta {
          font-size: 13px;
          color: var(--text-dimmed);
          padding: 8px 0 12px;
        }

        .search-loading {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px 0;
        }

        .search-skeleton {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .search-error {
          padding: 24px;
          text-align: center;
          color: var(--danger);
        }

        .load-more-btn {
          display: block;
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.02);
          color: var(--primary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .load-more-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
        }

        .load-more-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .user-result-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .user-result-card:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .user-result-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .user-result-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-result-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-result-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--text-main);
        }

        .user-result-username {
          font-size: 13px;
          color: var(--text-dimmed);
        }

        .user-result-bio {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hashtag-result-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .hashtag-result-card:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .hashtag-result-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          flex-shrink: 0;
        }

        .hashtag-result-info {
          display: flex;
          flex-direction: column;
        }

        .hashtag-result-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--text-main);
        }

        .hashtag-result-count {
          font-size: 13px;
          color: var(--text-dimmed);
        }
      `}</style>
    </MainLayout>
  );
};

export default SearchPage;
