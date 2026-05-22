import React, { useState } from 'react';
import { Heart, Repeat2, MessageSquare, Bookmark } from 'lucide-react';

interface ActionBarProps {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  isLikedInitially?: boolean;
  isRepostedInitially?: boolean;
  isBookmarkedInitially?: boolean;
  onLike: () => Promise<boolean>; // Returns new state
  onRepost: () => Promise<boolean>; // Returns new state
  onBookmark: () => Promise<boolean>; // Returns new state
  onCommentClick: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  likeCount,
  repostCount,
  replyCount,
  isLikedInitially = false,
  isRepostedInitially = false,
  isBookmarkedInitially = false,
  onLike,
  onRepost,
  onBookmark,
  onCommentClick,
}) => {
  const [liked, setLiked] = useState(isLikedInitially);
  const [likes, setLikes] = useState(likeCount);
  const [reposted, setReposted] = useState(isRepostedInitially);
  const [reposts, setReposts] = useState(repostCount);
  const [bookmarked, setBookmarked] = useState(isBookmarkedInitially);

  const [likePulse, setLikePulse] = useState(false);
  const [repostPulse, setRepostPulse] = useState(false);
  const [bookmarkPulse, setBookmarkPulse] = useState(false);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikePulse(true);
    setTimeout(() => setLikePulse(false), 300);

    try {
      const isNowLiked = await onLike();
      setLiked(isNowLiked);
      setLikes((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRepostPulse(true);
    setTimeout(() => setRepostPulse(false), 300);

    try {
      const isNowReposted = await onRepost();
      setReposted(isNowReposted);
      setReposts((prev) => (isNowReposted ? prev + 1 : Math.max(0, prev - 1)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkPulse(true);
    setTimeout(() => setBookmarkPulse(false), 300);

    try {
      const isNowBookmarked = await onBookmark();
      setBookmarked(isNowBookmarked);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="post-action-bar">
      {/* Comment Action */}
      <button className="action-btn comment-action" onClick={onCommentClick} title="Komentar">
        <div className="icon-wrapper">
          <MessageSquare size={18} />
        </div>
        <span className="action-count">{replyCount}</span>
      </button>

      {/* Repost Action */}
      <button
        className={`action-btn repost-action ${reposted ? 'active' : ''}`}
        onClick={handleRepostClick}
        title="Riposto"
      >
        <div className={`icon-wrapper ${repostPulse ? 'spin-anim' : ''}`}>
          <Repeat2 size={18} />
        </div>
        <span className="action-count">{reposts}</span>
      </button>

      {/* Like Action */}
      <button
        className={`action-btn like-action ${liked ? 'active' : ''}`}
        onClick={handleLikeClick}
        title="Pëlqe"
      >
        <div className={`icon-wrapper ${likePulse ? 'pulse-active' : ''}`}>
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </div>
        <span className="action-count">{likes}</span>
      </button>

      {/* Bookmark Action */}
      <button
        className={`action-btn bookmark-action ${bookmarked ? 'active' : ''}`}
        onClick={handleBookmarkClick}
        title="Ruaj"
      >
        <div className={`icon-wrapper ${bookmarkPulse ? 'pulse-active' : ''}`}>
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </div>
      </button>

      <style>{`
        .post-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 425px;
          margin-top: 12px;
          color: var(--text-dimmed);
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: inherit;
          padding: 8px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-round);
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .action-count {
          transition: color 0.2s ease;
        }

        /* Comment Action hover */
        .comment-action:hover {
          color: var(--comment);
        }
        .comment-action:hover .icon-wrapper {
          background-color: var(--comment-light);
        }

        /* Repost Action hover & active */
        .repost-action:hover {
          color: var(--repost);
        }
        .repost-action:hover .icon-wrapper {
          background-color: var(--repost-light);
        }
        .repost-action.active {
          color: var(--repost);
        }

        /* Like Action hover & active */
        .like-action:hover {
          color: var(--like);
        }
        .like-action:hover .icon-wrapper {
          background-color: var(--like-light);
        }
        .like-action.active {
          color: var(--like);
        }

        /* Bookmark Action hover & active */
        .bookmark-action:hover {
          color: var(--primary);
        }
        .bookmark-action:hover .icon-wrapper {
          background-color: var(--primary-light);
        }
        .bookmark-action.active {
          color: var(--primary);
        }

        /* Custom Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }

        .spin-anim {
          animation: spin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
};

export default ActionBar;
