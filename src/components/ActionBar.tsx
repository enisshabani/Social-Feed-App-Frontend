import React, { useEffect, useState } from 'react';
import { Bookmark, MessageSquare, Repeat2, Star } from 'lucide-react';

interface ActionBarProps {
  postId: number;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  isLikedInitially?: boolean;
  initialReactionType?: string;
  isRepostedInitially?: boolean;
  isBookmarkedInitially?: boolean;
  onLike: (reactionType: string) => Promise<boolean>;
  onRepost: () => Promise<boolean>;
  onBookmark: () => Promise<boolean>;
  onCommentClick: () => void;
}

const reactions = [
  { type: 'star', emoji: '\u2B50', label: 'Star' },
  { type: 'laugh', emoji: '\u{1F602}', label: 'Laugh' },
  { type: 'love', emoji: '\u{1F60D}', label: 'Love' },
  { type: 'wow', emoji: '\u{1F62E}', label: 'Wow' },
  { type: 'sad', emoji: '\u{1F622}', label: 'Sad' },
  { type: 'angry', emoji: '\u{1F621}', label: 'Angry' },
];

const getReaction = (type?: string | null) =>
  reactions.find((reaction) => reaction.type === type) || reactions[0];

const ActionBar: React.FC<ActionBarProps> = ({
  postId,
  likeCount,
  repostCount,
  replyCount,
  isLikedInitially = false,
  initialReactionType = 'star',
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
  const [reactionType, setReactionType] = useState(initialReactionType || 'star');

  const [likePulse, setLikePulse] = useState(false);
  const [repostPulse, setRepostPulse] = useState(false);
  const [bookmarkPulse, setBookmarkPulse] = useState(false);
  const [busyAction, setBusyAction] = useState<'like' | 'repost' | 'bookmark' | null>(null);

  useEffect(() => {
    setLiked(isLikedInitially);
    setLikes(likeCount);
    setReactionType(initialReactionType || 'star');
  }, [isLikedInitially, likeCount, initialReactionType, postId]);

  useEffect(() => {
    setReposted(isRepostedInitially);
    setReposts(repostCount);
  }, [isRepostedInitially, repostCount]);

  useEffect(() => {
    setBookmarked(isBookmarkedInitially);
  }, [isBookmarkedInitially]);

  const applyReaction = async (nextReactionType: string) => {
    if (busyAction) return;
    setLikePulse(true);
    setBusyAction('like');
    setTimeout(() => setLikePulse(false), 300);

    try {
      let isNowLiked = liked;
      if (!liked || reactionType === nextReactionType) {
        isNowLiked = await onLike(nextReactionType);
        setLikes((prev) => (isNowLiked ? prev + 1 : Math.max(0, prev - 1)));
      } else {
        await onLike(nextReactionType);
      }
      setLiked(isNowLiked);
      setReactionType(nextReactionType);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyAction(null);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await applyReaction(reactionType || 'star');
  };

  const handleReactionClick = async (e: React.MouseEvent, nextReactionType: string) => {
    e.stopPropagation();
    await applyReaction(nextReactionType);
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
      <button type="button" className="action-btn comment-action" onClick={onCommentClick} title="Komentar">
        <div className="icon-wrapper">
          <MessageSquare size={18} />
        </div>
        <span className="action-count">{replyCount}</span>
      </button>

      <button
        type="button"
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

      <div className="reaction-shell">
        <button
          type="button"
          className={`action-btn like-action ${liked ? 'active' : ''}`}
          onClick={handleLikeClick}
          disabled={busyAction !== null}
          title="React"
        >
          <div className={`icon-wrapper ${likePulse ? 'pulse-active' : ''}`}>
            {liked ? <span className="reaction-main-emoji">{getReaction(reactionType).emoji}</span> : <Star size={18} />}
          </div>
          <span className="action-count">{likes}</span>
        </button>
        <div className="reaction-picker" role="menu" aria-label="Choose reaction">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              type="button"
              className={`reaction-option ${liked && reactionType === reaction.type ? 'selected' : ''}`}
              onClick={(e) => handleReactionClick(e, reaction.type)}
              disabled={busyAction !== null}
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
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
          gap: 8px;
          width: 100%;
          max-width: 425px;
          margin-top: 12px;
          color: var(--text-dimmed);
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
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

        .reaction-shell {
          position: relative;
          flex: 0 0 auto;
        }

        .reaction-picker {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 8px);
          display: flex;
          gap: 4px;
          padding: 6px;
          max-width: calc(100vw - 32px);
          box-sizing: border-box;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-panel-solid);
          box-shadow: var(--shadow);
          opacity: 0;
          transform: translate(-50%, 4px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 5;
        }

        .reaction-picker::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 0;
          right: 0;
          height: 16px;
        }

        .reaction-shell:hover .reaction-picker,
        .reaction-shell:focus-within .reaction-picker {
          opacity: 1;
          transform: translate(-50%, 0) scale(1);
          pointer-events: auto;
        }

        .reaction-option {
          width: 32px;
          height: 32px;
          flex: 0 0 32px;
          border: none;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .comment-action:hover {
          color: var(--comment);
        }

        .comment-action:hover .icon-wrapper {
          background-color: var(--comment-light);
        }

        .repost-action:hover {
          color: var(--repost);
        }

        .repost-action:hover .icon-wrapper {
          background-color: var(--repost-light);
        }

        .repost-action.active {
          color: var(--repost);
        }

        .like-action:hover,
        .like-action.active {
          color: var(--like);
        }

        .like-action:hover .icon-wrapper {
          background-color: var(--like-light);
        }

        .bookmark-action:hover,
        .bookmark-action.active {
          color: var(--primary);
        }

        .bookmark-action:hover .icon-wrapper {
          background-color: var(--primary-light);
        }

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
