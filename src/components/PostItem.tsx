import React, { useState } from 'react';
import { User, Edit2, Trash2, Globe, Lock, EyeOff, X, Check, MessageSquare } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { Comment } from '../services/post.service';
import type { MatchContext } from '../services/search.service';
import ActionBar from './ActionBar';
import SentimentBadge from './SentimentBadge';
import { getLoggedInUser } from './SidebarLeft';
import { FollowButton } from '../modules/follows/components/FollowButton';

interface PostItemProps {
  post: any; // Can be Post or PostBrief
  onPostUpdated: () => void;
  matchContext?: MatchContext | null;
  highlightQuery?: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, onPostUpdated, matchContext, highlightQuery }) => {
  const currentUser = getLoggedInUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [updating, setUpdating] = useState(false);
  
  // Comments state (on-demand loading)
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Content Warning Expanded state
  const [cwExpanded, setCwExpanded] = useState(false);

  // Check if current user is the author (safely convert both to string)
  const isAuthor = currentUser && String(currentUser.id) === String(post.author_id);

  // CW parsing
  const cwRegex = /^CW:\s*(.*?)\s*\n\n---\n\n([\s\S]*)$/;
  const hasCW = post.content && cwRegex.test(post.content);
  let spoilerText = '';
  let bodyHtml = '';

  if (hasCW) {
    const match = post.content.match(cwRegex);
    spoilerText = match ? match[1] : '';
    if (post.content_html) {
      const htmlParts = post.content_html.split(/<br\s*\/?>\s*<br\s*\/?>\s*---\s*<br\s*\/?>\s*<br\s*\/?>/i);
      bodyHtml = htmlParts.length > 1 ? htmlParts.slice(1).join('<br/><br/>---<br/><br/>') : post.content_html;
    } else {
      bodyHtml = post.content.replace(/(?:\r\n|\r|\n)/g, '<br/>');
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }

    setUpdating(true);
    try {
      await PostService.updatePost(post.id, editContent);
      setIsEditing(false);
      onPostUpdated();
    } catch (err) {
      alert('Gabim gjatë përditësimit të postimit.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('A jeni i sigurt që dëshironi ta fshini këtë postim?')) return;

    try {
      await PostService.deletePost(post.id);
      onPostUpdated();
    } catch (err) {
      alert('Gabim gjatë fshirjes së postimit.');
    }
  };

  // Toggles the comment drawer and loads comment details on-demand from backend
  const handleCommentToggle = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && commentsList.length === 0) {
      setLoadingComments(true);
      try {
        const fullPost = await PostService.getPost(post.id);
        setCommentsList(fullPost.comments || []);
      } catch (err) {
        console.error('Gabim gjatë marrjes së komenteve:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const addedComment = await PostService.addComment(post.id, newCommentText);
      setCommentsList((prev) => [...prev, addedComment]);
      setNewCommentText('');
      // Notify parent to increment comment count in list view
      onPostUpdated();
    } catch (err) {
      alert('Gabim gjatë shtimit të komentit.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Callbacks for API action updates in ActionBar
  const onLikeAPI = async (): Promise<boolean> => {
    const res = await PostService.toggleLike(post.id);
    return res.liked;
  };

  const onRepostAPI = async (): Promise<boolean> => {
    const res = await PostService.toggleRepost(post.id);
    return res.reposted;
  };

  const onBookmarkAPI = async (): Promise<boolean> => {
    const res = await PostService.toggleBookmark(post.id);
    return res.bookmarked;
  };

  // Dynamic Date Formatter
  const formatPostDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'tani';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString('sq', { month: 'short', day: 'numeric' });
  };

  const authorInitial = post.author?.username ? post.author.username.charAt(0).toUpperCase() : 'U';

  return (
    <article className="post-item-wrapper">
      {/* Repost Indicator Header */}
      {post.is_repost && (
        <div className="repost-indicator">
          <span>↻ u ripostua nga @{post.author?.username || 'user'}</span>
        </div>
      )}

      <div className="post-main-content">
        {/* User Avatar Column */}
        <div className="avatar-column">
          {post.author?.avatar_url ? (
            <img
              src={post.author.avatar_url}
              alt={post.author.username}
              className="avatar"
              style={{ borderRadius: '4px', width: '44px', height: '44px' }}
            />
          ) : (
            <div
              className="avatar-circle"
              style={{
                borderRadius: '4px',
                width: '44px',
                height: '44px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                border: '1px solid rgba(99, 100, 255, 0.2)'
              }}
            >
              {authorInitial}
            </div>
          )}
        </div>

        {/* Text Details Column */}
        <div className="details-column">
          {/* Post Header Info */}
          <header className="post-item-header">
            <div className="author-metadata">
              <span className="author-display-name">
                {post.author?.display_name || post.author?.username || `User ${post.author_id}`}
              </span>
              <span className="author-username">@{post.author?.username || `user_${post.author_id}`}</span>
              <span className="bullet-spacer">•</span>
              <time className="post-time" dateTime={post.created_at}>
                {formatPostDate(post.created_at)}
              </time>
              
              {/* Visibility Badge */}
              <span className="visibility-badge" title={`Dukshmëria: ${post.visibility}`}>
                {post.visibility === 'public' && <Globe size={13} />}
                {post.visibility === 'private' && <Lock size={13} />}
                {post.visibility === 'unlisted' && <EyeOff size={13} />}
              </span>
            </div>

            {/* Author Operations — only show edit/delete on own posts */}
            {isAuthor && !post.is_repost && (
              <div className="author-actions">
                <button
                  className="btn-icon btn-action-edit"
                  onClick={() => setIsEditing(!isEditing)}
                  title="Ndrysho postimin"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn-icon btn-action-delete"
                  onClick={handleDelete}
                  title="Fshi postimin"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </header>

          {/* Post Body Content */}
          <div className="post-body-container">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="inline-edit-form">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="form-input inline-edit-textarea"
                  rows={3}
                  disabled={updating}
                  required
                />
                <div className="inline-edit-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary edit-cancel"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                  >
                    <X size={14} style={{ marginRight: '4px' }} /> Anulo
                  </button>
                  <button type="submit" className="btn btn-primary edit-save" disabled={updating}>
                    <Check size={14} style={{ marginRight: '4px' }} /> Ruaj
                  </button>
                </div>
              </form>
            ) : hasCW ? (
              <div className="cw-post-container">
                <div className="cw-alert-banner">
                  <div className="cw-alert-text">
                    <span>⚠️ Spoiler: {spoilerText}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-cw-toggle"
                    onClick={() => setCwExpanded(!cwExpanded)}
                  >
                    {cwExpanded ? 'Fshih' : 'Trego më shumë'}
                  </button>
                </div>
                <div className={cwExpanded ? 'cw-expanded-content' : 'cw-collapsed-content'}>
                  <div
                    className="post-text-content"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="post-text-content"
                dangerouslySetInnerHTML={{
                  __html: post.content_html || post.content.replace(/(?:\r\n|\r|\n)/g, '<br/>'),
                }}
              />
            )}
          </div>

          {/* Search: matched comment indicators */}
          {matchContext && !matchContext.post_match && matchContext.matched_comments.length > 0 && (
            <div className="match-context-badge">
              <MessageSquare size={13} />
              <span>Përputhje në {matchContext.matched_comments.length} koment{matchContext.matched_comments.length > 1 ? 'e' : ''}</span>
            </div>
          )}
          {matchContext && highlightQuery && matchContext.matched_comments.length > 0 && (
            <div className="matched-comments-preview">
              {matchContext.matched_comments.map((mc) => {
                const escapedQuery = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const html = mc.snippet.replace(
                  new RegExp(`(${escapedQuery})`, 'gi'),
                  '<mark>$1</mark>'
                );
                return (
                  <div key={mc.id} className="matched-comment-snippet">
                    <div className="matched-comment-avatar">
                      {mc.author.avatar_url ? (
                        <img src={mc.author.avatar_url} alt={mc.author.username} />
                      ) : (
                        <User size={12} />
                      )}
                    </div>
                    <div className="matched-comment-body">
                      <span className="matched-comment-author">@{mc.author.username}</span>
                      <span
                        className="matched-comment-text"
                        dangerouslySetInnerHTML={{ __html: html }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sentiment Badge */}
          {!isEditing && post.content && (
            <div style={{ padding: '0 16px 4px' }}>
              <SentimentBadge postText={post.content} postId={post.id} />
            </div>
          )}

          {/* Action Bar (Only visible if not currently editing) */}
          {!isEditing && (
            <ActionBar
              likeCount={post.like_count || 0}
              repostCount={post.repost_count || 0}
              replyCount={post.reply_count || 0}
              isLikedInitially={post.likes?.some((l: any) => l.user_id === currentUser?.id)}
              isRepostedInitially={post.reposts?.some((r: any) => r.user_id === currentUser?.id)}
              isBookmarkedInitially={false} // Will load bookmarked status dynamically if needed
              onLike={onLikeAPI}
              onRepost={onRepostAPI}
              onBookmark={onBookmarkAPI}
              onCommentClick={handleCommentToggle}
            />
          )}

          {/* Interactive Comments Drawer */}
          {showComments && (
            <div className="comments-drawer glass-panel">
              <h4 className="comments-title">Komentet</h4>

              {/* Comments List */}
              <div className="comments-list">
                {loadingComments ? (
                  <div className="comments-loading">Duke ngarkuar komentet...</div>
                ) : commentsList.length === 0 ? (
                  <div className="comments-empty">Nuk ka asnjë koment ende. Bëhu i pari!</div>
                ) : (
                  commentsList.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        <User size={14} />
                      </div>
                      <div className="comment-details">
                        <div className="comment-header">
                          <span className="comment-author">@{comment.author?.username || `user_${comment.author_id}`}</span>
                          <span className="comment-time">• {formatPostDate(comment.created_at)}</span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="add-comment-form">
                <input
                  type="text"
                  placeholder="Shkruaj një përgjigje..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="form-input comment-input"
                  disabled={submittingComment}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary comment-submit-btn"
                  disabled={submittingComment || !newCommentText.trim()}
                >
                  <MessageSquare size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .post-item-wrapper {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background-color: transparent;
          transition: background-color 0.15s ease;
          cursor: default;
        }

        .post-item-wrapper:hover {
          background-color: rgba(255, 255, 255, 0.015);
        }

        .repost-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          padding-left: 36px;
          font-size: 13px;
          font-weight: 600;
          color: var(--repost);
        }

        .post-main-content {
          display: flex;
          gap: 12px;
        }

        .avatar-column {
          display: flex;
          flex-direction: column;
        }

        .details-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .post-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .author-metadata {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 15px;
        }

        .author-display-name {
          font-weight: 700;
          color: var(--text-main);
        }

        .author-username {
          color: var(--text-dimmed);
        }

        .bullet-spacer {
          color: var(--text-dimmed);
        }

        .post-time {
          color: var(--text-dimmed);
        }

        .visibility-badge {
          display: inline-flex;
          align-items: center;
          color: var(--text-dimmed);
          margin-left: 2px;
        }

        .author-actions {
          display: flex;
          gap: 4px;
        }

        .btn-action-edit:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .btn-action-delete:hover {
          color: var(--error);
          background-color: var(--error-bg);
        }

        .post-body-container {
          margin-top: 6px;
        }

        /* Match context (search result comment matches) */
        .match-context-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          background: rgba(59, 130, 246, 0.08);
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
        }

        .matched-comments-preview {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.01);
        }

        .matched-comment-snippet {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .matched-comment-avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .matched-comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .matched-comment-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .matched-comment-author {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
        }

        .matched-comment-text {
          font-size: 13px;
          color: var(--text-dimmed);
          line-height: 1.4;
          word-break: break-word;
        }

        .matched-comment-text mark {
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary);
          border-radius: 2px;
          padding: 0 1px;
        }

        .post-text-content {
          font-size: 16px;
          line-height: 1.5;
          color: var(--text-main);
          word-break: break-word;
          white-space: pre-wrap;
        }

        /* Inline edit form */
        .inline-edit-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        .inline-edit-textarea {
          resize: none;
          font-size: 16px;
          line-height: 1.5;
        }

        .inline-edit-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .edit-cancel {
          padding: 6px 14px;
          font-size: 13px;
        }

        .edit-save {
          padding: 6px 14px;
          font-size: 13px;
        }

        /* Comments Drawer */
        .comments-drawer {
          margin-top: 16px;
          padding: 16px;
          border-radius: var(--radius-md);
          background-color: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border);
        }

        .comments-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 250px;
          overflow-y: auto;
          margin-bottom: 14px;
          padding-right: 4px;
        }

        .comments-loading, .comments-empty {
          font-size: 13px;
          color: var(--text-dimmed);
          text-align: center;
          padding: 12px 0;
        }

        .comment-item {
          display: flex;
          gap: 10px;
          padding: 8px;
          border-radius: var(--radius-sm);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .comment-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-round);
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .comment-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .comment-header {
          display: flex;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .comment-author {
          color: var(--primary);
        }

        .comment-time {
          color: var(--text-dimmed);
        }

        .comment-content {
          font-size: 14px;
          color: var(--text-main);
          line-height: 1.4;
          word-break: break-word;
        }

        /* Comment Input box */
        .add-comment-form {
          display: flex;
          gap: 8px;
        }

        .comment-input {
          flex: 1;
          padding: 8px 12px;
          border-radius: 9999px;
          font-size: 14px;
        }

        .comment-submit-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-round);
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </article>
  );
};

export default PostItem;
