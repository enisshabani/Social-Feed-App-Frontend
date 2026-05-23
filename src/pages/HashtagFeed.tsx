import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, ArrowLeft } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import PostItem from '../components/PostItem';
import { PostService } from '../services/post.service';
import type { Post } from '../services/post.service';

const LIMIT = 20;

const HashtagFeed: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (skip: number, append: boolean) => {
    if (!name) return;
    try {
      const res = await PostService.getHashtagPosts(name, skip, LIMIT);
      if (append) {
        setPosts((prev) => [...prev, ...res]);
      } else {
        setPosts(res);
      }
      setHasMore(res.length === LIMIT);
      setNotFound(false);
      setError('');
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError('Gabim gjatë ngarkimit të postimeve.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [name]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setNotFound(false);
    fetchPosts(0, false);
  }, [fetchPosts]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchPosts(posts.length, true);
  };

  return (
    <MainLayout
      currentTab="explore"
      setCurrentTab={() => {}}
      searchQuery=""
      setSearchQuery={() => {}}
    >
      <div className="hashtag-feed-page">
        {/* Header */}
        <div className="hashtag-feed-header">
          <button
            className="hashtag-feed-back"
            onClick={() => navigate(-1)}
            aria-label="Kthehu mbrapa"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="hashtag-feed-title">
            <Hash size={22} />
            <h2>{name}</h2>
          </div>
          {!loading && !notFound && (
            <span className="hashtag-feed-count">{posts.length} postime</span>
          )}
        </div>

        {/* Content */}
        <div className="hashtag-feed-content">
          {loading ? (
            <div className="hashtag-feed-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="hashtag-skeleton">
                  <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '100%', marginTop: '8px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '8px' }} />
                </div>
              ))}
            </div>
          ) : notFound ? (
            <div className="hashtag-feed-empty">
              <Hash size={48} className="hashtag-feed-empty-icon" />
              <h3>Hashtag nuk u gjet</h3>
              <p>Hashtag-u "#{name}" nuk ekziston.</p>
            </div>
          ) : error ? (
            <div className="hashtag-feed-error">{error}</div>
          ) : posts.length === 0 ? (
            <div className="hashtag-feed-empty">
              <Hash size={48} className="hashtag-feed-empty-icon" />
              <h3>Asnjë postim</h3>
              <p>Nuk ka ende postime me #{name}.</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostItem key={post.id} post={post} onPostUpdated={() => {}} />
              ))}
              {hasMore && (
                <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Duke ngarkuar...' : 'Ngarko më shumë'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .hashtag-feed-page {
          padding: 16px 0;
        }

        .hashtag-feed-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 0 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }

        .hashtag-feed-back {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: none;
          color: var(--text-main);
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .hashtag-feed-back:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .hashtag-feed-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hashtag-feed-title h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-main);
        }

        .hashtag-feed-count {
          margin-left: auto;
          font-size: 13px;
          color: var(--text-dimmed);
        }

        .hashtag-feed-content {
          margin-top: 4px;
        }

        .hashtag-feed-loading {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hashtag-skeleton {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }

        .hashtag-feed-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 64px 24px;
          text-align: center;
          color: var(--text-dimmed);
        }

        .hashtag-feed-empty-icon {
          opacity: 0.3;
          margin-bottom: 16px;
          color: var(--text-dimmed);
        }

        .hashtag-feed-empty h3 {
          font-size: 18px;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .hashtag-feed-empty p {
          font-size: 14px;
        }

        .hashtag-feed-error {
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
      `}</style>
    </MainLayout>
  );
};

export default HashtagFeed;
