import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PostService } from '../services/post.service';
import MainLayout from '../components/MainLayout';

import PostItem from '../components/PostItem';
import { Sparkles, Bookmark, Search, RefreshCw, Hash, AlertCircle } from 'lucide-react';
import { getFollowing } from '../modules/follows/api/followsApi';
import { getLoggedInUser } from '../components/SidebarLeft';

const Feed: React.FC = () => {
  const currentUser = getLoggedInUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'home' | 'explore' | 'bookmarks') || 'home';
  const [currentTab, setCurrentTab] = useState<'home' | 'explore' | 'bookmarks'>(initialTab);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Hashtag Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Home Sub-tabs: 'forYou' (all posts) or 'following' (posts from users we follow)
  const [homeSubTab, setHomeSubTab] = useState<'forYou' | 'following'>('forYou');
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  // Focus reference for text composing
  const feedTopRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    fetchPosts();
  }, [currentTab, selectedTag, refreshKey]);

  useEffect(() => {
    const loadFollowingList = async () => {
      if (currentUser?.id) {
        try {
          const list = await getFollowing(currentUser.id, 0, 1000);
          const ids = new Set(list.map(item => item.followee_id));
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

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      let fetchedItems: any[] = [];
      
      if (selectedTag) {
        // Tag filtering feed
        const res = await PostService.getPostsByTag(selectedTag);
        fetchedItems = res.items || [];
      } else if (currentTab === 'home' || currentTab === 'explore') {
        // Home Feed
        const res = await PostService.getHomeFeed(0, 40);
        fetchedItems = res.items || [];
      } else if (currentTab === 'bookmarks') {
        // Bookmarks Feed
        fetchedItems = await PostService.getBookmarks(0, 40);
      }

      setPosts(fetchedItems);
    } catch (err: any) {
      console.error(err);
      setError('Ndodhi një gabim gjatë ngarkimit të postimeve.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    // Increment refresh key to trigger a feed re-fetch
    setRefreshKey((prev) => prev + 1);
    // Scroll to top of feed to see the new post
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };


  const handleDismissTag = () => {
    setSelectedTag(null);
  };

  const handleScrollToTop = () => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Find the textarea inside CreatePostBox and focus it
    const textarea = document.querySelector('.post-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  // Real-time client-side search filter
  const filteredPosts = posts.filter((post) => {
    // Local subtab filtering for "Të ndjekur"
    if (!selectedTag && currentTab === 'home' && homeSubTab === 'following') {
      const isSelf = currentUser && post.author_id === currentUser.id;
      const isFollowed = followingIds.has(post.author_id);
      if (!isSelf && !isFollowed) return false;
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const contentMatch = post.content.toLowerCase().includes(query);
    const authorMatch = post.author?.username?.toLowerCase().includes(query) ||
                        post.author?.display_name?.toLowerCase().includes(query);
    return contentMatch || authorMatch;
  });

  return (
    <MainLayout
      currentTab={currentTab}
      setCurrentTab={handleTabChange}
      onPostClick={handleScrollToTop}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      <div ref={feedTopRef} />

      {/* Sticky Glass Header */}
      <header className="feed-header">
        <div className="feed-header-title">
          <h2>
            {selectedTag ? `Hashtag: #${selectedTag}` : 
             currentTab === 'home' ? 'Ballina' : 
             currentTab === 'explore' ? 'Eksploro' : 'Të ruajtura'}
          </h2>
          <button 
            className="btn-icon refresh-feed-btn" 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            title="Rifresko feed-in"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>

        {/* Home Subtabs (Për ty, Të ndjekur) */}
        {!selectedTag && currentTab === 'home' && (
          <div className="feed-subtabs">
            <button 
              className={`subtab-btn ${homeSubTab === 'forYou' ? 'active' : ''}`}
              onClick={() => setHomeSubTab('forYou')}
            >
              Për ty
            </button>
            <button 
              className={`subtab-btn ${homeSubTab === 'following' ? 'active' : ''}`}
              onClick={() => setHomeSubTab('following')}
            >
              Të ndjekur
            </button>
          </div>
        )}
      </header>

      {/* Hashtag Filtering Banner */}
      {selectedTag && (
        <div className="filter-banner glass-panel">
          <div className="filter-banner-text">
            <Hash size={18} className="banner-hash-icon" />
            <span>Po shfaqen postimet që përmbajnë tagun <strong>#{selectedTag}</strong></span>
          </div>
          <button className="btn btn-secondary banner-dismiss" onClick={handleDismissTag}>
            Shfaq të gjitha
          </button>
        </div>
      )}

      {/* Main Feed Content Area */}
      <div className="feed-content-scroller">
        {/* Create Post Area moved to left column */}

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
                  <h3>Nuk ka asnjë postim të ruajtur</h3>
                  <p>Klikoni ikonën e faqeshënuesit në postimet e rregullta për t'i ruajtur këtu për t'i parë më vonë.</p>
                </>
              ) : selectedTag ? (
                <>
                  <Hash size={48} className="empty-icon text-primary" />
                  <h3>Nuk u gjet asnjë postim</h3>
                  <p>Nuk ka postime që përmbajnë hashtagun #{selectedTag} në këtë tenant momentalisht.</p>
                </>
              ) : searchQuery ? (
                <>
                  <Search size={48} className="empty-icon text-muted" />
                  <h3>Nuk u gjet asnjë rezultat</h3>
                  <p>Nuk mundëm të gjenim asnjë postim që përputhet me kërkimin tuaj: "{searchQuery}". Provoni terma të tjerë.</p>
                </>
              ) : (
                <>
                  <Sparkles size={48} className="empty-icon text-primary" />
                  <h3>Feed-i juaj është bosh</h3>
                  <p>Bëhu i pari që ndan një mendim ose histori me komunitetin! Shkruaj diçka më lart.</p>
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
              />
            ))
          )}
        </div>
      </div>

      <style>{`
        .refresh-feed-btn {
          color: var(--primary);
        }

        .refresh-feed-btn:hover {
          background-color: var(--primary-light);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        /* Feed Subtabs Për ty / Të ndjekur */
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