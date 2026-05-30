import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PostService } from '../services/post.service';
import MainLayout from '../components/MainLayout';

import PostItem from '../components/PostItem';
import CreatePostBox from '../components/CreatePostBox';
import { Sparkles, Bookmark, Search, RefreshCw, Hash, AlertCircle, X } from 'lucide-react';
import { getFollowing } from '../modules/follows/api/followsApi';
import { getLoggedInUser } from '../components/SidebarLeft';
import { useLanguage } from '../context/LanguageContext';

const Feed: React.FC = () => {
  const currentUser = getLoggedInUser();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'home' | 'explore' | 'bookmarks') || 'home';
  const initialTag = searchParams.get('tag');
  const [currentTab, setCurrentTab] = useState<'home' | 'explore' | 'bookmarks'>(initialTab);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [feedMode, setFeedMode] = useState<'latest' | 'popular' | 'media' | 'polls'>('latest');

  // Search & Hashtag Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const [refreshKey, setRefreshKey] = useState(0);

  // Home Sub-tabs: 'forYou' (all posts) or 'following' (posts from users we follow)
  const [homeSubTab, setHomeSubTab] = useState<'forYou' | 'following'>('forYou');
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const pageSize = 20;

  // Focus reference for text composing
  const feedTopRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Sync tab to URL
  const handleTabChange = (tab: 'home' | 'explore' | 'bookmarks') => {
    setCurrentTab(tab);
    setSelectedTag(null);
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (tab === 'bookmarks') {
      setSearchParams({ tab: 'bookmarks' });
    } else {
      setSearchParams({});
    }
  };

  const handleHashtagClick = (tagName: string) => {
    const cleanTag = tagName.replace(/^#/, '').trim();
    if (!cleanTag) return;
    setSelectedTag(cleanTag);
    setCurrentTab('home');
    setSearchQuery('');
    setSearchParams({ tag: cleanTag });
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const nextTab = (searchParams.get('tab') as 'home' | 'explore' | 'bookmarks') || 'home';
    const nextTag = searchParams.get('tag');
    setCurrentTab(nextTag ? 'home' : nextTab);
    setSelectedTag(nextTag);
  }, [searchParams]);

  useEffect(() => {
    fetchPosts(0, false);
    setNewPostsCount(0);
  }, [currentTab, selectedTag, refreshKey]);

  useEffect(() => {
    const loadFollowingList = async () => {
      if (currentUser?.id) {
        try {
          const list = await getFollowing(currentUser.id, 0, 100);
          const ids = new Set(list.map(item => Number(item.followee_id)));
          setFollowingIds(ids);
        } catch (e) {
          console.error("Failed to load following IDs", e);
        }
      }
    };
    loadFollowingList();

    const handleGlobalPostCreated = () => {
      setRefreshKey((prev) => prev + 1);
      feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    window.addEventListener('postCreated', handleGlobalPostCreated);
    return () => {
      window.removeEventListener('postCreated', handleGlobalPostCreated);
    };
  }, [refreshKey, currentUser?.id]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || searchQuery) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        fetchPosts(posts.length, true);
      }
    }, { rootMargin: '360px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, posts.length, searchQuery]);

  const fetchPosts = async (skip = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      let fetchedItems: any[] = [];
      let moreAvailable = false;
      
      if (selectedTag) {
        // Tag filtering feed
        const res = await PostService.getPostsByTag(selectedTag, skip, pageSize);
        fetchedItems = res.items || [];
        moreAvailable = res.has_more;
      } else if (currentTab === 'home' || currentTab === 'explore') {
        // Home Feed
        const res = await PostService.getHomeFeed(skip, pageSize);
        fetchedItems = res.items || [];
        moreAvailable = res.has_more;
      } else if (currentTab === 'bookmarks') {
        // Bookmarks Feed
        fetchedItems = await PostService.getBookmarks(skip, pageSize);
        moreAvailable = fetchedItems.length === pageSize;
      }

      setPosts((prev) => (append ? [...prev, ...fetchedItems] : fetchedItems));
      setHasMore(moreAvailable);
    } catch (err: any) {
      console.error(err);
      setError(t('feed_error'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePostCreated = () => {
    // Increment refresh key to trigger a feed re-fetch
    setRefreshKey((prev) => prev + 1);
    // Scroll to top of feed to see the new post
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRefreshCheck = () => {
    if (loading) return;
    setPosts([]);
    setHasMore(false);
    setNewPostsCount(0);
    setRefreshKey((prev) => prev + 1);
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNewPosts = () => {
    setNewPostsCount(0);
    setRefreshKey((prev) => prev + 1);
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDismissTag = () => {
    setSelectedTag(null);
    setSearchParams({});
  };

  const handleScrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Find the textarea inside CreatePostBox and focus it
    const textarea = document.querySelector('.mastodon-post-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  // Real-time client-side search/filter/sort.
  const filteredPosts = useMemo(() => posts.filter((post) => {
    // Local subtab filtering for "TÃ« ndjekur"
    if (!selectedTag && currentTab === 'home' && homeSubTab === 'following') {
      const isSelf = currentUser && String(post.author_id) === String(currentUser.id);
      const isFollowed = followingIds.has(Number(post.author_id));
      if (!isSelf && !isFollowed) return false;
    }

    if (feedMode === 'media' && !(post.media?.length > 0)) return false;
    if (feedMode === 'polls' && !post.poll) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const contentMatch = (post.content || '').toLowerCase().includes(query);
    const authorMatch = post.author?.username?.toLowerCase().includes(query) ||
                        post.author?.display_name?.toLowerCase().includes(query);
    return contentMatch || authorMatch;
  }).sort((a, b) => {
    if (feedMode === 'popular') {
      const scoreA = (a.like_count || 0) + (a.reply_count || 0) + (a.repost_count || 0);
      const scoreB = (b.like_count || 0) + (b.reply_count || 0) + (b.repost_count || 0);
      return scoreB - scoreA || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [posts, selectedTag, currentTab, homeSubTab, currentUser, followingIds, searchQuery, feedMode]);

  const feedModes: { key: typeof feedMode; label: string }[] = [
    { key: 'latest', label: 'Latest' },
    { key: 'popular', label: 'Popular' },
    { key: 'media', label: 'Media' },
    { key: 'polls', label: 'Polls' },
  ];

  return (
    <MainLayout
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      onPostClick={handleScrollToTop}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showSidebarComposer={false}
      onHashtagClick={handleHashtagClick}
    >
      <div ref={feedTopRef} />

      {/* Sticky Glass Header */}
      <header className="feed-header">
        <div className="feed-header-title">
          <h2>
            {selectedTag ? `Hashtag: #${selectedTag}` :
             currentTab === 'home' ? t('feed_home') :
             currentTab === 'explore' ? t('feed_explore') : t('feed_bookmarks')}
          </h2>
          <button 
            className="btn-icon refresh-feed-btn" 
            onClick={handleRefreshCheck}
            disabled={loading}
            title={t('feed_refresh')}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>

        {/* Home Subtabs (PÃ«r ty, TÃ« ndjekur) */}
        {!selectedTag && currentTab === 'home' && (
          <div className="feed-subtabs">
            <button 
              className={`subtab-btn ${homeSubTab === 'forYou' ? 'active' : ''}`}
              onClick={() => setHomeSubTab('forYou')}
            >
              {t('feed_for_you')}
            </button>
            <button 
              className={`subtab-btn ${homeSubTab === 'following' ? 'active' : ''}`}
              onClick={() => setHomeSubTab('following')}
            >
              {t('feed_following')}
            </button>
          </div>
        )}
      </header>

      {/* Hashtag Filtering Banner */}
      {selectedTag && (
        <div className="filter-banner glass-panel">
          <div className="filter-banner-text">
            <Hash size={18} className="banner-hash-icon" />
            <span>{t('feed_filter_showing')} <strong>#{selectedTag}</strong></span>
          </div>
          <button className="btn btn-secondary banner-dismiss" onClick={handleDismissTag}>
            {t('feed_filter_show_all')}
          </button>
        </div>
      )}

      {newPostsCount > 0 && (
        <button type="button" className="new-posts-banner" onClick={showNewPosts}>
          Show {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'}
        </button>
      )}

      {/* Main Feed Content Area */}
      <div className="feed-content-scroller">
        {!selectedTag && currentTab === 'home' && (
          <div className="feed-compose-shell">
            <CreatePostBox onPostCreated={handlePostCreated} />
          </div>
        )}

        <div className="feed-section-summary">
          <span>{filteredPosts.length} {t('search_meta_posts')}</span>
          <div className="feed-mode-row">
            {feedModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                className={`feed-mode-btn ${feedMode === mode.key ? 'active' : ''}`}
                onClick={() => setFeedMode(mode.key)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {homeSubTab === 'following' && currentTab === 'home' && (
            <span>{t('feed_summary_following')}</span>
          )}
          {searchQuery && <span>{t('feed_summary_local_search')}: "{searchQuery}"</span>}
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-container">
            <AlertCircle size={18} style={{ marginRight: '8px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Feed Posts List */}
        <div className="posts-feed-list">
          {loading ? (
            // Premium skeleton loaders
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="post-skeleton-card">
                <div className="skeleton-avatar skeleton"></div>
                <div className="skeleton-details">
                  <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
                  <div className="skeleton skeleton-body-line" style={{ width: '90%', marginTop: '12px' }}></div>
                  <div className="skeleton skeleton-body-line" style={{ width: '75%', marginTop: '8px' }}></div>
                  <div className="skeleton skeleton-footer" style={{ width: '60%', marginTop: '16px' }}></div>
                </div>
              </div>
            ))
          ) : filteredPosts.length === 0 ? (
            // Premium empty states
            <div className="empty-feed-card glass-panel">
              {currentTab === 'bookmarks' ? (
                <>
                  <Bookmark size={48} className="empty-icon text-primary" />
                  <h3>{t('feed_empty_bookmarks_title')}</h3>
                  <p>{t('feed_empty_bookmarks_desc')}</p>
                </>
              ) : selectedTag ? (
                <>
                  <Hash size={48} className="empty-icon text-primary" />
                  <h3>{t('feed_empty_tag_title')}</h3>
                  <p>{t('feed_empty_tag_desc')} #{selectedTag}.</p>
                </>
              ) : searchQuery ? (
                <>
                  <Search size={48} className="empty-icon text-muted" />
                  <h3>{t('feed_empty_search_title')}</h3>
                  <p>{t('feed_empty_search_desc')} "{searchQuery}"</p>
                </>
              ) : (
                <>
                  <Sparkles size={48} className="empty-icon text-primary" />
                  <h3>{t('feed_empty_title')}</h3>
                  <p>{t('feed_empty_desc')}</p>
                </>
              )}
            </div>
          ) : (
            // Render actual posts
            filteredPosts.map((post) => (
              <PostItem 
                key={post.id} 
                post={post} 
                onPostUpdated={handlePostCreated} 
                isBookmarkedInitially={currentTab === 'bookmarks'}
                onOpenDetails={setSelectedPost}
              />
            ))
          )}
        </div>

        {!loading && filteredPosts.length > 0 && hasMore && !searchQuery && (
          <div className="load-more-row">
            <div ref={loadMoreRef} className="load-more-sentinel">
              {loadingMore ? t('feed_loading_more') : 'Scroll for more'}
            </div>
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="post-detail-overlay" onClick={() => setSelectedPost(null)}>
          <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-detail-header">
              <strong>Post</strong>
              <button type="button" className="btn-icon" onClick={() => setSelectedPost(null)}>
                <X size={18} />
              </button>
            </div>
            <PostItem
              post={selectedPost}
              onPostUpdated={() => {
                setSelectedPost(null);
                handlePostCreated();
              }}
              isBookmarkedInitially={currentTab === 'bookmarks'}
            />
          </div>
        </div>
      )}

      <style>{`
        .refresh-feed-btn {
          color: var(--primary);
          flex: 0 0 auto;
          width: 38px;
          height: 38px;
          margin-left: 12px;
        }

        .refresh-feed-btn:hover {
          background-color: var(--primary-light);
        }

        .refresh-feed-btn:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .feed-compose-shell {
          border-bottom: 1px solid var(--border);
          background: rgba(40, 44, 55, 0.36);
          padding: 16px;
        }

        .feed-compose-shell .create-post-box.mastodon-compose {
          border-radius: 8px;
          box-shadow: none;
        }

        .feed-section-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
          min-height: 42px;
          padding: 10px 20px;
          border-bottom: 1px solid var(--border);
          color: var(--text-dimmed);
          font-size: 13px;
          font-weight: 600;
          background: rgba(25, 27, 34, 0.82);
        }

        .feed-mode-row {
          display: inline-flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-left: auto;
        }

        .feed-mode-btn {
          border: 1px solid var(--border);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-muted);
          cursor: pointer;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .feed-mode-btn.active {
          color: var(--primary);
          background: var(--primary-light);
          border-color: rgba(99, 100, 255, 0.28);
        }

        .new-posts-banner {
          position: sticky;
          top: 80px;
          z-index: 20;
          display: block;
          margin: 12px auto 0;
          border: 1px solid rgba(99, 100, 255, 0.32);
          border-radius: 999px;
          background: var(--primary);
          color: #fff;
          cursor: pointer;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        /* Feed Subtabs PÃ«r ty / TÃ« ndjekur */
        .feed-subtabs {
          display: flex;
          border-bottom: 1px solid var(--border);
        }

        .subtab-btn {
          flex: 1;
          padding: 16px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .subtab-btn:hover {
          background-color: rgba(255, 255, 255, 0.03);
          color: var(--text-main);
        }

        .subtab-btn.active {
          color: var(--text-main);
        }

        .subtab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 56px;
          height: 4px;
          border-radius: 99px;
          background-color: var(--primary);
        }

        /* Tag filtering banner */
        .filter-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          margin: 16px;
          border-radius: var(--radius-md);
          background-color: var(--primary-light);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .filter-banner-text {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: var(--text-main);
        }

        .banner-hash-icon {
          color: var(--primary);
        }

        .banner-dismiss {
          padding: 6px 14px;
          font-size: 13px;
          border-radius: 999px;
        }

        .feed-content-scroller {
          padding-bottom: 100px;
        }

        .load-more-row {
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .load-more-sentinel {
          color: var(--text-dimmed);
          font-size: 13px;
          font-weight: 700;
          min-height: 32px;
          display: flex;
          align-items: center;
        }

        .post-detail-overlay {
          position: fixed;
          inset: 0;
          z-index: 250;
          background: rgba(0, 0, 0, 0.64);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 16px;
          overflow-y: auto;
        }

        .post-detail-modal {
          width: min(680px, 100%);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
          background: var(--bg-app);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
        }

        .post-detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          background: rgba(25, 27, 34, 0.96);
          color: var(--text-main);
        }

        /* Premium Skeleton styles */
        .post-skeleton-card {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 12px;
        }

        .skeleton-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-round);
          flex-shrink: 0;
        }

        .skeleton-details {
          flex: 1;
        }

        .skeleton-title {
          height: 16px;
          border-radius: 4px;
        }

        .skeleton-body-line {
          height: 14px;
          border-radius: 4px;
        }

        .skeleton-footer {
          height: 12px;
          border-radius: 4px;
        }

        /* Empty states styles */
        .empty-feed-card {
          margin: 20px;
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border);
        }

        .empty-icon {
          filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.05));
        }

        .empty-feed-card h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-main);
        }

        .empty-feed-card p {
          font-size: 15px;
          color: var(--text-dimmed);
          max-width: 380px;
          line-height: 1.5;
        }

        .text-primary {
          color: var(--primary);
        }
      `}</style>
    </MainLayout>
  );
};

export default Feed;

