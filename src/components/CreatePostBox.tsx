import React, { useRef, useState } from 'react';
import { Globe, EyeOff, Lock, ChevronDown, Paperclip, BarChart2, X, Image, Video } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { MediaInput } from '../services/post.service';
import { getLoggedInUser } from './SidebarLeft';
import AiAssistButton from './AiAssistButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { resolveAssetUrl } from '../utils/assets';
import SafeAvatar from './SafeAvatar';

interface CreatePostBoxProps {
  onPostCreated?: () => void;
  replyToPostId?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  onPostCreated,
  replyToPostId,
  placeholder,
  autoFocus = false,
}) => {
  const currentUser = getLoggedInUser();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [cwActive, setCwActive] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollActive, setPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const characterLimit = 500;
  const combinedLength = content.length + (cwActive ? warningText.length : 0);
  const isOverLimit = combinedLength > characterLimit;
  const charsRemaining = characterLimit - combinedLength;

  const normalizedMediaUrl = mediaUrl.trim();
  const hasMedia = normalizedMediaUrl.length > 0;
  const cleanPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
  const hasValidPoll = pollActive && pollQuestion.trim().length > 0 && cleanPollOptions.length >= 2;
  const pollHasDraft = pollActive && (pollQuestion.trim().length > 0 || cleanPollOptions.length > 0);
  const canPost = (content.trim().length > 0 || hasMedia || hasValidPoll) && (!pollHasDraft || hasValidPoll) && !isOverLimit && !submitting && (!cwActive || warningText.trim().length > 0);

  const isValidMediaUrl = (value: string) => {
    if (value.startsWith('/uploads/')) return true;
    if (value.startsWith('data:image/')) return true;

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setErrorMessage('');
    setSubmitting(true);

    const baseContent = content.trim() || pollQuestion.trim();
    const finalContent = cwActive && warningText.trim()
      ? `CW: ${warningText.trim()}\n\n---\n\n${baseContent}`
      : baseContent;
    const media: MediaInput[] = hasMedia ? [{ url: normalizedMediaUrl, media_type: mediaType }] : [];
    const poll = hasValidPoll ? { question: pollQuestion.trim(), options: cleanPollOptions.slice(0, 4) } : undefined;

    if (hasMedia && !isValidMediaUrl(normalizedMediaUrl)) {
      setErrorMessage(t('create_post_alert_invalid_url'));
      setSubmitting(false);
      return;
    }

    try {
      await PostService.createPost(
        finalContent || (mediaType === 'image' ? 'Shared an image' : 'Shared a video'),
        visibility,
        replyToPostId,
        media,
        poll
      );
      setContent('');
      setMediaUrl('');
      setMediaType('image');
      setShowMediaInput(false);
      setWarningText('');
      setCwActive(false);
      setPollActive(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      if (onPostCreated) {
        onPostCreated();
      } else {
        // Fire global event so Feed.tsx auto-refreshes when the composer lives outside the feed.
        window.dispatchEvent(new Event('postCreated'));
      }
    } catch (err) {
      setErrorMessage(t('create_post_alert_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiHashtags = (hashtags: string[]) => {
    const tagString = hashtags.map((t) => `#${t}`).join(' ');
    setContent((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${tagString}` : tagString;
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    setErrorMessage('');
    try {
      const uploaded = await PostService.uploadPostMedia(file);
      setMediaUrl(uploaded.url);
      setMediaType(uploaded.media_type);
      setShowMediaInput(true);
    } catch {
      setErrorMessage(t('create_post_alert_upload_error'));
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const userInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U';
  const avatarUrl = user?.avatar_url;
  const copy = {
    placeholder: placeholder || t('create_post_placeholder'),
    publish: t('create_post_publish'),
    reply: t('create_post_reply'),
    warningPlaceholder: t('create_post_warning'),
  };

  return (
    <div className="create-post-box mastodon-compose">
      <form onSubmit={handlePostSubmit}>
        <div className="mastodon-compose-row">
          {/* Avatar Column */}
          <div className="compose-avatar-column">
            <SafeAvatar
              src={avatarUrl}
              alt={currentUser?.username || 'user'}
              fallbackText={userInitial}
              className="compose-avatar"
              imgClassName="compose-avatar-img"
              imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
              title={`KyÃ§ur si @${currentUser?.username || 'user'}`}
            />
          </div>

          {/* Fields Column */}
          <div className="compose-fields-column">
            {/* Content Warning Input */}
            {cwActive && (
              <div className="warning-input-wrapper">
                <input
                  type="text"
                  placeholder={copy.warningPlaceholder}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="warning-input"
                  required
                  autoFocus
                />
              </div>
            )}

            {/* Text Area */}
            <div className="mastodon-textarea-wrapper">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={copy.placeholder}
                rows={replyToPostId ? 2 : 4}
                className="mastodon-post-textarea"
                autoFocus={autoFocus}
              />
            </div>
            {showMediaInput && (
              <div className="compose-media-panel">
                <div className="compose-media-controls">
                  <div className="compose-media-type" role="group" aria-label="Media type">
                    <button
                      type="button"
                      className={`compose-media-type-btn ${mediaType === 'image' ? 'active' : ''}`}
                      onClick={() => setMediaType('image')}
                    >
                      <Image size={15} />
                      {t("create_post_media_image")}
                    </button>
                    <button
                      type="button"
                      className={`compose-media-type-btn ${mediaType === 'video' ? 'active' : ''}`}
                      onClick={() => setMediaType('video')}
                    >
                      <Video size={15} />
                      {t("create_post_media_video")}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="compose-media-close"
                    title="Remove media"
                    onClick={() => {
                      setMediaUrl('');
                      setShowMediaInput(false);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="compose-media-url"
                  placeholder={mediaType === 'image' ? 'https://example.com/photo.jpg' : 'https://example.com/video.mp4'}
                />
                <div className="compose-media-upload-row">
                  <button
                    type="button"
                    className="compose-media-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingMedia}
                  >
                    {uploadingMedia ? t('create_post_uploading') : t('create_post_media_upload')}
                  </button>
                  <span>{t('create_post_media_paste')}</span>
                </div>
                {normalizedMediaUrl && isValidMediaUrl(normalizedMediaUrl) && (
                  <div className="compose-media-preview">
                    {mediaType === 'video' ? (
                      <video src={resolveAssetUrl(normalizedMediaUrl)} controls />
                    ) : (
                      <img src={resolveAssetUrl(normalizedMediaUrl)} alt="Media preview" />
                    )}
                  </div>
                )}
              </div>
            )}
            {pollActive && (
              <div className="compose-poll-panel">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="compose-poll-input"
                  placeholder="Poll question"
                  maxLength={280}
                />
                <div className="compose-poll-options">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="compose-poll-option-row">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[index] = e.target.value;
                          setPollOptions(next);
                        }}
                        className="compose-poll-input"
                        placeholder={`Option ${index + 1}`}
                        maxLength={120}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="compose-poll-remove"
                          title="Remove option"
                          onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    className="compose-poll-add"
                    onClick={() => setPollOptions((prev) => [...prev, ''])}
                  >
                    Add option
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="compose-error" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Toolbar */}
        <div className="mastodon-toolbar">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
          />
          <div className="mastodon-toolbar-left">
            {/* Attachment */}
            <button
              type="button"
              className={`btn-mastodon-tool ${showMediaInput ? 'active' : ''}`}
              title="Add image or video URL"
              onClick={() => setShowMediaInput((value) => !value)}
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              className="btn-mastodon-tool"
              title={uploadingMedia ? t('create_post_uploading') : t('create_post_media_upload')}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
            >
              <Image size={18} />
            </button>

            {/* Poll */}
            <button
              type="button"
              className={`btn-mastodon-tool ${pollActive ? 'active' : ''}`}
              title="Add poll"
              onClick={() => setPollActive((value) => !value)}
            >
              <BarChart2 size={18} />
            </button>

            {/* Visibility dropdown */}
            <div className="custom-select-wrapper">
              <label className="select-icon-label" title="DukshmÃ«ria e postimit">
                {visibility === 'public' && <Globe size={18} />}
                {visibility === 'private' && <Lock size={18} />}
                {visibility === 'unlisted' && <EyeOff size={18} />}
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="visibility-select"
                >
                  <option value="public" style={{ background: '#282c37' }}>{t('create_post_visibility_public')}</option>
                  <option value="private" style={{ background: '#282c37' }}>{t('create_post_visibility_private')}</option>
                  <option value="unlisted" style={{ background: '#282c37' }}>{t('create_post_visibility_unlisted')}</option>
                </select>
                <ChevronDown size={12} style={{ display: 'none' }} />
              </label>
            </div>

            {/* CW toggle */}
            <button
              type="button"
              className={`btn-mastodon-tool ${cwActive ? 'cw-active' : ''}`}
              onClick={() => { setCwActive(!cwActive); if (cwActive) setWarningText(''); }}
              title="ParalajmÃ«rim pÃ«r PÃ«rmbajtjen (CW)"
            >
              <span>CW</span>
            </button>

            {/* AI Assist */}
            <AiAssistButton
              postText={content}
              onSelectHashtags={handleAiHashtags}
            />
          </div>

          <div className="mastodon-toolbar-right">
            <span className={`mastodon-char-counter ${charsRemaining < 20 ? (charsRemaining < 0 ? 'warning' : 'near-limit') : ''}`}>
              {charsRemaining}
            </span>
            <button
              type="submit"
              className="btn-mastodon-publish"
              disabled={!canPost}
            >
              {submitting ? '...' : replyToPostId ? copy.reply : copy.publish}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostBox;


