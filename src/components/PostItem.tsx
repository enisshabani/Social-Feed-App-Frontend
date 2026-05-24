import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Edit2, Trash2, Globe, Lock, EyeOff, X, Check, MessageSquare, Hash, Image as ImageIcon, Upload, Crop } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { Comment, MediaInput, Poll } from '../services/post.service';
import type { MatchContext } from '../services/search.service';
import ActionBar from './ActionBar';
import SentimentBadge from './SentimentBadge';
import { getLoggedInUser } from './SidebarLeft';
import { resolveAssetUrl } from '../utils/assets';

interface PostItemProps {
  post: any; // Can be Post or PostBrief
  onPostUpdated: () => void;
  matchContext?: MatchContext | null;
  highlightQuery?: string;
  isBookmarkedInitially?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({
  post,
  onPostUpdated,
  matchContext,
  highlightQuery,
  isBookmarkedInitially = false,
}) => {
  const currentUser = getLoggedInUser();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editMedia, setEditMedia] = useState<MediaInput[]>(
    (post.media || []).map((media: any) => ({
      url: media.url,
      media_type: media.media_type || 'image',
      meta: media.meta || {},
    }))
  );
  const [updating, setUpdating] = useState(false);
  const [uploadingEditMedia, setUploadingEditMedia] = useState(false);
  const [cropDraft, setCropDraft] = useState<{ index: number; cropX: number; cropY: number; cropZoom: number } | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Comments state (on-demand loading)
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyCount, setReplyCount] = useState(post.reply_count || 0);
  const [localPoll, setLocalPoll] = useState<Poll | undefined>(post.poll);
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);
  const [votingPoll, setVotingPoll] = useState(false);

  // Content Warning Expanded state
  const [cwExpanded, setCwExpanded] = useState(false);

  useEffect(() => {
    setEditContent(post.content);
    setEditMedia((post.media || []).map((media: any) => ({
      url: media.url,
      media_type: media.media_type || 'image',
      meta: media.meta || {},
    })));
    setReplyCount(post.reply_count || 0);
    setLocalPoll(post.poll);
    setSelectedPollOption(null);
  }, [post.content, post.media, post.reply_count, post.poll]);

  // Check if current user is the author (safely convert both to string)
  const isAuthor = currentUser && String(currentUser.id) === String(post.author_id);
  const authorUsername = post.author?.username;
  const authorProfilePath = authorUsername
    ? `/profile/${encodeURIComponent(authorUsername)}`
    : isAuthor
      ? '/profile'
      : null;

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const renderPlainText = (value: string) => escapeHtml(value).replace(/(?:\r\n|\r|\n)/g, '<br/>');
  const getMediaCrop = (media: any) => ({
    x: Number(media?.meta?.cropX ?? 50),
    y: Number(media?.meta?.cropY ?? 50),
    zoom: Number(media?.meta?.cropZoom ?? 1),
  });
  const mediaSignature = (items: any[] = []) => JSON.stringify(items.map((media) => ({
    url: media.url,
    media_type: media.media_type || 'image',
    meta: {
      cropX: Number(media?.meta?.cropX ?? 50),
      cropY: Number(media?.meta?.cropY ?? 50),
      cropZoom: Number(media?.meta?.cropZoom ?? 1),
    },
  })));

  const handleAuthorProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (authorProfilePath) {
      navigate(authorProfilePath);
    }
  };
  const goToProfile = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation();
    if (username) navigate(`/profile/${encodeURIComponent(username)}`);
  };

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
      bodyHtml = renderPlainText(post.content);
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const originalMediaSignature = mediaSignature(post.media || []);
    const nextMediaSignature = mediaSignature(editMedia);

    if (!editContent.trim()) {
      return;
    }

    if (editContent === post.content && nextMediaSignature === originalMediaSignature) {
      setIsEditing(false);
      return;
    }

    setUpdating(true);
    try {
      await PostService.updatePost(post.id, editContent, post.visibility, editMedia);
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
      setReplyCount((prev: number) => prev + 1);
      setNewCommentText('');
    } catch (err) {
      alert('Gabim gjatë shtimit të komentit.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!window.confirm('A jeni i sigurt qe deshironi ta fshini kete koment?')) return;

    try {
      await PostService.removeComment(commentId);
      setCommentsList((prev) => prev.filter((comment) => comment.id !== commentId));
      setReplyCount((prev: number) => Math.max(0, prev - 1));
    } catch (err) {
      alert('Gabim gjate fshirjes se komentit.');
    }
  };

  // Callbacks for API action updates in ActionBar
  const onLikeAPI = async (reactionType: string): Promise<boolean> => {
    const res = await PostService.toggleLike(post.id, reactionType);
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
  const displayName = post.author?.display_name || post.author?.username || `User ${post.author_id}`;
  const handleTagClick = (tagName: string) => {
    navigate(`/hashtag/${encodeURIComponent(tagName)}`);
  };

  const handleEditFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditMedia(true);
    try {
      const uploaded = await PostService.uploadPostMedia(file);
      setEditMedia([{ ...uploaded, meta: { cropX: 50, cropY: 50 } }]);
    } catch {
      alert('Gabim gjate ngarkimit te imazhit.');
    } finally {
      setUploadingEditMedia(false);
      e.target.value = '';
    }
  };

  const handlePollVote = async (optionId: number) => {
    if (votingPoll) return;
    setVotingPoll(true);
    try {
      const updatedPoll = await PostService.votePoll(post.id, optionId);
      setLocalPoll(updatedPoll);
      setSelectedPollOption(optionId);
    } catch {
      alert('Gabim gjatë votimit në sondazh.');
    } finally {
      setVotingPoll(false);
    }
  };

  const pollTotalVotes = localPoll?.options.reduce((sum, option) => sum + (option.vote_count || 0), 0) || 0;
  const currentUserReaction = post.likes?.find((like: any) => String(like.user_id) === String(currentUser?.id))?.reaction_type || 'star';

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
              src={resolveAssetUrl(post.author.avatar_url)}
              alt={post.author.username}
              className="avatar"
              style={{ borderRadius: '4px', width: '44px', height: '44px', cursor: 'pointer' }}
              onClick={handleAuthorProfileClick}
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
                border: '1px solid rgba(99, 100, 255, 0.2)',
                cursor: 'pointer'
              }}
              onClick={handleAuthorProfileClick}
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
              <span
                className="author-display-name"
                style={{ cursor: 'pointer' }}
                onClick={handleAuthorProfileClick}
              >
                {displayName}
              </span>
              <span
                className="author-username"
                style={{ cursor: 'pointer' }}
                onClick={handleAuthorProfileClick}
              >@{post.author?.username || `user_${post.author_id}`}</span>
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
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleEditFileSelected}
                  style={{ display: 'none' }}
                />
                <div className="inline-edit-media-panel">
                  <div className="inline-edit-media-header">
                    <span><ImageIcon size={14} /> Media</span>
                    <div className="inline-edit-media-actions">
                      <button
                        type="button"
                        className="btn btn-secondary edit-media-btn"
                        onClick={() => editFileInputRef.current?.click()}
                        disabled={updating || uploadingEditMedia}
                      >
                        <Upload size={14} /> {uploadingEditMedia ? '...' : 'Change'}
                      </button>
                      {editMedia.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary edit-media-btn"
                            onClick={() => {
                              const crop = getMediaCrop(editMedia[0]);
                              setCropDraft({ index: 0, cropX: crop.x, cropY: crop.y, cropZoom: crop.zoom });
                            }}
                            disabled={updating || editMedia[0]?.media_type === 'video'}
                          >
                            <Crop size={14} /> Crop
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary edit-media-btn danger"
                            onClick={() => setEditMedia([])}
                            disabled={updating}
                          >
                            <Trash2 size={14} /> Delete image
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {editMedia.length > 0 ? (
                    editMedia.slice(0, 1).map((media, index) => {
                      const crop = getMediaCrop(media);
                      return (
                        <div key={`${media.url}-${index}`} className="inline-edit-media-editor">
                          <div className="inline-edit-media-preview">
                            {media.media_type === 'video' ? (
                              <video src={resolveAssetUrl(media.url)} controls />
                            ) : (
                              <img
                                src={resolveAssetUrl(media.url)}
                                alt=""
                                style={{
                                  objectPosition: `${crop.x}% ${crop.y}%`,
                                  transform: `scale(${crop.zoom})`,
                                  transformOrigin: `${crop.x}% ${crop.y}%`,
                                }}
                              />
                            )}
                          </div>
                          {media.media_type !== 'video' && (
                            <div className="crop-summary">Crop: {Math.round(crop.x)}% / {Math.round(crop.y)}%, zoom {crop.zoom.toFixed(1)}x</div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      className="inline-edit-media-empty"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={updating || uploadingEditMedia}
                    >
                      <ImageIcon size={16} /> Add image or video
                    </button>
                  )}
                </div>
                <div className="inline-edit-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary edit-cancel"
                    onClick={() => {
                      setEditContent(post.content);
                      setEditMedia((post.media || []).map((media: any) => ({
                        url: media.url,
                        media_type: media.media_type || 'image',
                        meta: media.meta || {},
                      })));
                      setIsEditing(false);
                    }}
                    disabled={updating}
                  >
                    <X size={14} style={{ marginRight: '4px' }} /> Anulo
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary edit-delete-post"
                    onClick={handleDelete}
                    disabled={updating}
                  >
                    <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete post
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
                  __html: post.content_html || renderPlainText(post.content),
                }}
              />
            )}
          </div>

          {post.media?.length > 0 && (
            <div className={`post-media-grid media-count-${Math.min(post.media.length, 4)}`}>
              {post.media.slice(0, 4).map((media: any) => (
                <a
                  key={media.id || media.url}
                  href={resolveAssetUrl(media.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="post-media-frame"
                  onClick={(e) => e.stopPropagation()}
                >
                  {media.media_type === 'video' ? (
                    <video src={resolveAssetUrl(media.url)} controls />
                  ) : (
                    <img
                      src={resolveAssetUrl(media.url)}
                      alt=""
                      loading="lazy"
                      style={{
                        objectPosition: `${getMediaCrop(media).x}% ${getMediaCrop(media).y}%`,
                        transform: `scale(${getMediaCrop(media).zoom})`,
                        transformOrigin: `${getMediaCrop(media).x}% ${getMediaCrop(media).y}%`,
                      }}
                    />
                  )}
                </a>
              ))}
            </div>
          )}

          {localPoll && (
            <div className="post-poll">
              <div className="post-poll-question">{localPoll.question}</div>
              <div className="post-poll-options">
                {localPoll.options.map((option) => {
                  const percent = pollTotalVotes > 0 ? Math.round((option.vote_count / pollTotalVotes) * 100) : 0;
                  const isSelected = selectedPollOption === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`post-poll-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePollVote(option.id)}
                      disabled={votingPoll}
                    >
                      <span className="post-poll-fill" style={{ width: `${percent}%` }} />
                      <span className="post-poll-label">{option.text}</span>
                      <span className="post-poll-percent">{percent}%</span>
                    </button>
                  );
                })}
              </div>
              <div className="post-poll-total">
                {pollTotalVotes} {pollTotalVotes === 1 ? 'vote' : 'votes'}
              </div>
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="post-tag-row">
              {post.tags.slice(0, 6).map((tag: any) => (
                <button
                  key={tag.id || tag.name}
                  type="button"
                  className="post-tag-chip"
                  onClick={() => handleTagClick(tag.name)}
                >
                  <Hash size={12} />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

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
                        <img
                          src={resolveAssetUrl(mc.author.avatar_url)}
                          alt={mc.author.username}
                          onClick={(e) => goToProfile(e, mc.author.username)}
                        />
                      ) : (
                        <button
                          type="button"
                          className="mini-profile-button"
                          onClick={(e) => goToProfile(e, mc.author.username)}
                        >
                          <User size={12} />
                        </button>
                      )}
                    </div>
                    <div className="matched-comment-body">
                      <span
                        className="matched-comment-author clickable-author"
                        onClick={(e) => goToProfile(e, mc.author.username)}
                      >@{mc.author.username}</span>
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
            <div className="sentiment-row">
              <SentimentBadge postText={post.content} postId={post.id} />
            </div>
          )}

          {/* Action Bar (Only visible if not currently editing) */}
          {!isEditing && (
            <ActionBar
              postId={post.id}
              likeCount={post.like_count || 0}
              repostCount={post.repost_count || 0}
              replyCount={replyCount}
              isLikedInitially={post.likes?.some((l: any) => l.user_id === currentUser?.id)}
              initialReactionType={currentUserReaction}
              isRepostedInitially={post.reposts?.some((r: any) => r.user_id === currentUser?.id)}
              isBookmarkedInitially={isBookmarkedInitially}
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
                  commentsList.map((comment) => {
                    const canDeleteComment = String(comment.author_id) === String(currentUser?.id);

                    return (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-avatar">
                        {comment.author?.avatar_url ? (
                          <img
                            src={resolveAssetUrl(comment.author.avatar_url)}
                            alt={comment.author.username}
                            onClick={(e) => goToProfile(e, comment.author?.username)}
                          />
                        ) : (
                          <button
                            type="button"
                            className="mini-profile-button"
                            onClick={(e) => goToProfile(e, comment.author?.username)}
                          >
                            <User size={14} />
                          </button>
                        )}
                      </div>
                      <div className="comment-details">
                        <div className="comment-header">
                          <span
                            className="comment-author clickable-author"
                            onClick={(e) => goToProfile(e, comment.author?.username)}
                          >@{comment.author?.username || `user_${comment.author_id}`}</span>
                          <span className="comment-time">• {formatPostDate(comment.created_at)}</span>
                        </div>
                          {canDeleteComment && (
                            <button
                              type="button"
                              className="comment-delete-btn"
                              title="Fshi komentin"
                              onClick={() => handleCommentDelete(comment.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    </div>
                    );
                  })
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

      {cropDraft && editMedia[cropDraft.index] && (
        <div className="crop-modal-overlay" onClick={() => setCropDraft(null)}>
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crop-modal-header">
              <strong>Crop image</strong>
              <button type="button" className="btn-icon" onClick={() => setCropDraft(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="crop-stage">
              <img
                src={resolveAssetUrl(editMedia[cropDraft.index].url)}
                alt=""
                style={{
                  objectPosition: `${cropDraft.cropX}% ${cropDraft.cropY}%`,
                  transform: `scale(${cropDraft.cropZoom})`,
                  transformOrigin: `${cropDraft.cropX}% ${cropDraft.cropY}%`,
                }}
              />
              <div className="crop-window" />
            </div>
            <div className="crop-modal-controls">
              <label>
                Position X
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cropDraft.cropX}
                  onChange={(e) => setCropDraft((prev) => prev ? { ...prev, cropX: Number(e.target.value) } : prev)}
                />
              </label>
              <label>
                Position Y
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cropDraft.cropY}
                  onChange={(e) => setCropDraft((prev) => prev ? { ...prev, cropY: Number(e.target.value) } : prev)}
                />
              </label>
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={cropDraft.cropZoom}
                  onChange={(e) => setCropDraft((prev) => prev ? { ...prev, cropZoom: Number(e.target.value) } : prev)}
                />
              </label>
            </div>
            <div className="crop-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setCropDraft(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditMedia((prev) => prev.map((item, itemIndex) => (
                    itemIndex === cropDraft.index
                      ? {
                          ...item,
                          meta: {
                            ...(item.meta || {}),
                            cropX: cropDraft.cropX,
                            cropY: cropDraft.cropY,
                            cropZoom: cropDraft.cropZoom,
                          },
                        }
                      : item
                  )));
                  setCropDraft(null);
                }}
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .post-item-wrapper {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background-color: transparent;
          transition: background-color 0.15s ease, border-color 0.15s ease;
          cursor: default;
        }

        .post-item-wrapper:hover {
          background-color: rgba(255, 255, 255, 0.025);
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
          cursor: pointer;
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

        .clickable-author {
          cursor: pointer;
        }

        .clickable-author:hover {
          color: var(--garfield-orange, #f28c28);
          text-decoration: underline;
        }

        .mini-profile-button {
          width: 100%;
          height: 100%;
          border: none;
          background: transparent;
          color: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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

        .post-media-grid {
          display: grid;
          gap: 2px;
          margin-top: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-dark);
        }

        .media-count-1 {
          grid-template-columns: 1fr;
        }

        .media-count-2,
        .media-count-4 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .media-count-3 {
          grid-template-columns: 1.1fr 0.9fr;
        }

        .media-count-3 .post-media-frame:first-child {
          grid-row: span 2;
        }

        .post-media-frame {
          display: block;
          min-height: 160px;
          max-height: 360px;
          background: rgba(255, 255, 255, 0.04);
        }

        .post-media-frame img,
        .post-media-frame video {
          width: 100%;
          height: 100%;
          min-height: inherit;
          max-height: inherit;
          object-fit: cover;
          display: block;
        }

        .post-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .post-poll {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 12px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
        }

        .post-poll-question {
          color: var(--text-main);
          font-size: 15px;
          font-weight: 800;
          line-height: 1.35;
        }

        .post-poll-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .post-poll-option {
          position: relative;
          min-height: 40px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid rgba(99, 100, 255, 0.28);
          border-radius: 7px;
          background: rgba(99, 100, 255, 0.06);
          color: var(--text-main);
          cursor: pointer;
          padding: 9px 11px;
          text-align: left;
        }

        .post-poll-option:hover:not(:disabled) {
          border-color: rgba(99, 100, 255, 0.54);
          background: rgba(99, 100, 255, 0.1);
        }

        .post-poll-option:disabled {
          cursor: wait;
          opacity: 0.8;
        }

        .post-poll-option.selected {
          border-color: var(--primary);
        }

        .post-poll-fill {
          position: absolute;
          inset: 0 auto 0 0;
          background: rgba(99, 100, 255, 0.2);
          pointer-events: none;
        }

        .post-poll-label,
        .post-poll-percent {
          position: relative;
          z-index: 1;
        }

        .post-poll-label {
          min-width: 0;
          overflow-wrap: anywhere;
          font-size: 14px;
          font-weight: 700;
        }

        .post-poll-percent {
          flex-shrink: 0;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
        }

        .post-poll-total {
          color: var(--text-dimmed);
          font-size: 12px;
          font-weight: 700;
        }

        .post-tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1px solid rgba(99, 100, 255, 0.24);
          border-radius: 999px;
          background: rgba(99, 100, 255, 0.08);
          color: var(--primary);
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .post-tag-chip:hover {
          background: rgba(99, 100, 255, 0.16);
        }

        .sentiment-row {
          display: flex;
          margin-top: 10px;
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
          flex-wrap: wrap;
        }

        .inline-edit-media-panel {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
        }

        .inline-edit-media-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
        }

        .inline-edit-media-header span,
        .inline-edit-media-actions,
        .edit-media-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .inline-edit-media-actions {
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .edit-media-btn {
          padding: 6px 10px;
          font-size: 12px;
        }

        .edit-media-btn.danger,
        .edit-delete-post {
          color: var(--error);
        }

        .inline-edit-media-editor {
          display: grid;
          grid-template-columns: minmax(160px, 240px) 1fr;
          gap: 12px;
          align-items: center;
        }

        .inline-edit-media-preview {
          height: 150px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
          background: var(--bg-dark);
        }

        .inline-edit-media-preview img,
        .inline-edit-media-preview video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .crop-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .crop-summary {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .crop-controls label {
          display: flex;
          flex-direction: column;
          gap: 5px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
        }

        .crop-controls input {
          accent-color: var(--garfield-orange, #f28c28);
        }

        .inline-edit-media-empty {
          min-height: 54px;
          border: 1px dashed var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .inline-edit-media-empty:hover {
          border-color: var(--garfield-orange, #f28c28);
          color: var(--garfield-orange, #f28c28);
        }

        .crop-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.68);
        }

        .crop-modal {
          width: min(620px, 100%);
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-panel-solid);
          box-shadow: var(--shadow);
          padding: 14px;
        }

        .crop-modal-header,
        .crop-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .crop-modal-header {
          margin-bottom: 12px;
        }

        .crop-stage {
          position: relative;
          height: min(58vh, 390px);
          overflow: hidden;
          border-radius: 8px;
          background: var(--bg-dark);
        }

        .crop-stage img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .crop-window {
          position: absolute;
          inset: 10%;
          border: 2px solid #fff;
          box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.36);
          pointer-events: none;
        }

        .crop-window::before,
        .crop-window::after {
          content: '';
          position: absolute;
          inset: 33.333% 0 auto;
          border-top: 1px solid rgba(255, 255, 255, 0.65);
        }

        .crop-window::after {
          inset: 66.666% 0 auto;
        }

        .crop-modal-controls {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 14px 0;
        }

        .crop-modal-controls label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .crop-modal-controls input {
          accent-color: var(--garfield-orange, #f28c28);
        }

        .crop-modal-actions {
          justify-content: flex-end;
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
          overflow: hidden;
        }

        .comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: pointer;
        }

        .comment-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .comment-header {
          display: flex;
          align-items: center;
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

        .comment-delete-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          margin-left: auto;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: var(--text-dimmed);
          cursor: pointer;
        }

        .comment-delete-btn:hover {
          color: var(--error);
          background: var(--error-bg);
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

        @media (max-width: 640px) {
          .inline-edit-media-editor {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </article>
  );
};

export default PostItem;
