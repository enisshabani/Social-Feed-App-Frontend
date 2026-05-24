import React, { useEffect, useState } from 'react';
import { Star, Repeat2, MessageSquare, Bookmark } from 'lucide-react';

interface ActionBarProps {
  postId: number;
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
  postId,
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
  const [reactionEmoji, setReactionEmoji] = useState<string | null>(null);

  const [likePulse, setLikePulse] = useState(false);
  const [repostPulse, setRepostPulse] = useState(false);
  const [bookmarkPulse, setBookmarkPulse] = useState(false);
  const [busyAction, setBusyAction] = useState<'like' | 'repost' | 'bookmark' | null>(null);
  const reactionOptions = ['⭐', '😂', '😍', '😮', '😢', '😡'];
  const reactionStorageKey = `kapak:post-reaction:${postId}`;

  useEffect(() => {
    setLiked(isLikedInitially);
    setLikes(likeCount);
    if (isLikedInitially) {
      setReactionEmoji(localStorage.getItem(reactionStorageKey) || '⭐');
    } else {
      setReactionEmoji(null);
      localStorage.removeItem(reactionStorageKey);
    }
  }, [isLikedInitially, likeCount, reactionStorageKey]);

  useEffect(() => {
    setReposted(isRepostedInitially);
    setReposts(repostCount);
  }, [isRepostedInitially, repostCount]);

  useEffect(() => {
    setBookmarked(isBookmarkedInitially);
  }, [isBookmarkedInitially]);

  const applyReaction = async (emoji: string) => {
    if (busyAction) return;
    setLikePulse(true);
    setBusyAction('like');
    setTimeout(() => setLikePulse(false), 300);

    try {
      let isNowLiked = liked;
      if (!liked || reactionEmoji === emoji) {
        isNowLiked = await onLike();
        setLikes((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
      }
      setLiked(isNowLiked);
      setReactionEmoji(isNowLiked ? emoji : null);
      if (isNowLiked) {
        localStorage.setItem(reactionStorageKey, emoji);
      } else {
        localStorage.removeItem(reactionStorageKey);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await applyReaction(reactionEmoji || '⭐');
  };

  const handleReactionClick = async (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    await applyReaction(emoji);
  };

  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyAction) return;
    setRepostPulse(true);
    setBusyAction('repost');
    setTimeout(() => setRepostPulse(false), 300);

    try {
      const isNowReposted = await onRepost();
      setReposted(isNowReposted);
      setReposts((prev) => (isNowReposted ? prev + 1 : Math.max(0, prev - 1)));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busyAction) return;
    setBookmarkPulse(true);
    setBusyAction('bookmark');
    setTimeout(() => setBookmarkPulse(false), 300);

    try {
      const isNowBookmarked = await onBookmark();
      setBookmarked(isNowBookmarked);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
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
        disabled={busyAction !== null}
        title="Riposto"
      >
        <div className={`icon-wrapper ${repostPulse ? 'spin-anim' : ''}`}>
          <Repeat2 size={18} />
        </div>
        <span className="action-count">{reposts}</span>
      </button>

      {/* Like Action */}
      <div className="reaction-shell">
      <button
        className={`action-btn like-action ${liked ? 'active' : ''}`}
        onClick={handleLikeClick}
        disabled={busyAction !== null}
        title="Pëlqe"
      >
        <div className={`icon-wrapper ${likePulse ? 'pulse-active' : ''}`}>
          {reactionEmoji ? <span className="reaction-main-emoji">{reactionEmoji}</span> : <Star size={18} />}
        </div>
        <span className="action-count">{likes}</span>
      </button>
        <div className="reaction-picker" role="menu" aria-label="Choose reaction">
          {reactionOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`reaction-option ${reactionEmoji === emoji ? 'selected' : ''}`}
              onClick={(e) => handleReactionClick(e, emoji)}
              disabled={busyAction !== null}
              title={`React ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmark Action */}
      <button
        className={`action-btn bookmark-action ${bookmarked ? 'active' : ''}`}
        onClick={handleBookmarkClick}
        disabled={busyAction !== null}
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

        .action-btn:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .reaction-shell {
          position: relative;
        }

        .reaction-picker {
          position: absolute;
          left: 0;
          bottom: calc(100% + 6px);
          display: flex;
          gap: 4px;
          padding: 6px;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-panel-solid);
          box-shadow: var(--shadow);
          opacity: 0;
          transform: translateY(4px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 5;
        }

        .reaction-shell:hover .reaction-picker,
        .reaction-shell:focus-within .reaction-picker {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .reaction-option {
          width: 30px;
          height: 30px;
          border: none;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          transition: transform 0.16s ease, background-color 0.16s ease;
        }

        .reaction-option:hover,
        .reaction-option.selected {
          background: rgba(242, 140, 40, 0.16);
          transform: translateY(-2px) scale(1.12);
        }

        .reaction-main-emoji {
          font-size: 17px;
          line-height: 1;
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
