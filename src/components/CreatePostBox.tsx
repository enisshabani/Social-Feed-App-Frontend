import React, { useRef, useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  EyeOff,
  Globe,
  HelpCircle,
  Image,
  Lock,
  Smile,
  Video,
  X,
} from 'lucide-react';
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

const emojis = ['😀', '😂', '😍', '🔥', '✨', '👏', '🙏', '💡', '🚀', '❤️', '🤔', '✅'];

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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterLimit = 500;
  const combinedLength = content.length + (cwActive ? warningText.length : 0);
  const isOverLimit = combinedLength > characterLimit;
  const charsRemaining = characterLimit - combinedLength;
  const normalizedMediaUrl = mediaUrl.trim();
  const hasMedia = normalizedMediaUrl.length > 0;
  const cleanPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
  const hasValidPoll = pollActive && pollQuestion.trim().length > 0 && cleanPollOptions.length >= 2;
  const pollHasDraft = pollActive && (pollQuestion.trim().length > 0 || cleanPollOptions.length > 0);
  const canPost = (content.trim().length > 0 || hasMedia || hasValidPoll)
    && (!pollHasDraft || hasValidPoll)
    && !isOverLimit
    && !submitting
    && (!cwActive || warningText.trim().length > 0);

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

  const resetComposer = () => {
    setContent('');
    setMediaUrl('');
    setMediaType('image');
    setShowMediaInput(false);
    setWarningText('');
    setCwActive(false);
    setPollActive(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setEmojiOpen(false);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setErrorMessage('');

    if (hasMedia && !isValidMediaUrl(normalizedMediaUrl)) {
      setErrorMessage(t('create_post_alert_invalid_url'));
      return;
    }

    setSubmitting(true);
    const baseContent = content.trim() || pollQuestion.trim();
    const finalContent = cwActive && warningText.trim()
      ? `CW: ${warningText.trim()}\n\n---\n\n${baseContent}`
      : baseContent;
    const media: MediaInput[] = hasMedia ? [{ url: normalizedMediaUrl, media_type: mediaType }] : [];
    const poll = hasValidPoll ? { question: pollQuestion.trim(), options: cleanPollOptions.slice(0, 4) } : undefined;

    try {
      await PostService.createPost(
        finalContent || (mediaType === 'image' ? 'Shared an image' : 'Shared a video'),
        visibility,
        replyToPostId,
        media,
        poll
      );
      resetComposer();
      if (onPostCreated) {
        onPostCreated();
      } else {
        window.dispatchEvent(new Event('postCreated'));
      }
    } catch {
      setErrorMessage(t('create_post_alert_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiHashtags = (hashtags: string[]) => {
    const tagString = hashtags.map((tag) => `#${tag}`).join(' ');
    setContent((prev) => {
      const trimmed = prev.trimEnd();
      return trimmed ? `${trimmed} ${tagString}` : tagString;
    });
  };

  const uploadFile = async (file: File) => {
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
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = '';
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    setContent(`${content.slice(0, start)}${emoji}${content.slice(end)}`);
    setEmojiOpen(false);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const addQuestionPrompt = () => {
    setContent((prev) => (prev.trim() ? prev : 'Question: '));
    window.requestAnimationFrame(() => textareaRef.current?.focus());
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
    <div
      className="create-post-box mastodon-compose"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
      }}
    >
      <form onSubmit={handlePostSubmit}>
        <div className="mastodon-compose-row">
          <div className="compose-avatar-column">
            <SafeAvatar
              src={avatarUrl}
              alt={currentUser?.username || 'user'}
              fallbackText={userInitial}
              className="compose-avatar"
              imgClassName="compose-avatar-img"
              imgStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
              title={`Kycur si @${currentUser?.username || 'user'}`}
            />
          </div>

          <div className="compose-fields-column">
            {cwActive && (
              <input
                type="text"
                placeholder={copy.warningPlaceholder}
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                className="warning-input"
                required
              />
            )}

            <div className="mastodon-textarea-wrapper">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={copy.placeholder}
                rows={replyToPostId ? 2 : 4}
                className="mastodon-post-textarea"
                autoFocus={autoFocus}
              />
            </div>

            {showMediaInput && (
              <div className="compose-media-panel simple-compose-panel">
                <div className="compose-panel-header">
                  <div className="compose-media-type" role="group" aria-label="Media type">
                    <button type="button" className={`compose-media-type-btn ${mediaType === 'image' ? 'active' : ''}`} onClick={() => setMediaType('image')}>
                      <Image size={15} />
                      {t('create_post_media_image')}
                    </button>
                    <button type="button" className={`compose-media-type-btn ${mediaType === 'video' ? 'active' : ''}`} onClick={() => setMediaType('video')}>
                      <Video size={15} />
                      {t('create_post_media_video')}
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
                  placeholder={mediaType === 'image' ? 'Paste image URL or upload' : 'Paste video URL or upload'}
                />
                <button type="button" className="compose-media-upload-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}>
                  {uploadingMedia ? t('create_post_uploading') : t('create_post_media_upload')}
                </button>
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
              <div className="compose-poll-panel simple-compose-panel">
                <div className="compose-panel-header">
                  <strong>Poll</strong>
                  <button type="button" className="compose-media-close" title="Remove poll" onClick={() => setPollActive(false)}>
                    <X size={16} />
                  </button>
                </div>
                <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} className="compose-poll-input" placeholder="Ask a question" maxLength={280} />
                <div className="compose-poll-options">
                  {pollOptions.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[index] = e.target.value;
                        setPollOptions(next);
                      }}
                      className="compose-poll-input"
                      placeholder={`Choice ${index + 1}`}
                      maxLength={120}
                    />
                  ))}
                </div>
                {pollOptions.length < 4 && (
                  <button type="button" className="compose-poll-add" onClick={() => setPollOptions((prev) => [...prev, ''])}>
                    Add choice
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

        <div className="mastodon-toolbar">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelected} style={{ display: 'none' }} />
          <div className="mastodon-toolbar-left">
            <button type="button" className={`btn-mastodon-tool ${showMediaInput ? 'active' : ''}`} title="Photo or video" onClick={() => setShowMediaInput((value) => !value)}>
              <Image size={18} />
            </button>
            <button type="button" className={`btn-mastodon-tool ${pollActive ? 'active' : ''}`} title="Poll" onClick={() => setPollActive((value) => !value)}>
              <BarChart2 size={18} />
            </button>
            <button type="button" className="btn-mastodon-tool" title="Question" onClick={addQuestionPrompt}>
              <HelpCircle size={18} />
            </button>
            <button type="button" className={`btn-mastodon-tool ${emojiOpen ? 'active' : ''}`} title="Emoji" onClick={() => setEmojiOpen((value) => !value)}>
              <Smile size={18} />
            </button>

            <div className="custom-select-wrapper compact-visibility">
              <label className="select-icon-label" title="Post visibility">
                {visibility === 'public' && <Globe size={18} />}
                {visibility === 'private' && <Lock size={18} />}
                {visibility === 'unlisted' && <EyeOff size={18} />}
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="visibility-select">
                  <option value="public" style={{ background: '#282c37' }}>{t('create_post_visibility_public')}</option>
                  <option value="private" style={{ background: '#282c37' }}>{t('create_post_visibility_private')}</option>
                  <option value="unlisted" style={{ background: '#282c37' }}>{t('create_post_visibility_unlisted')}</option>
                </select>
                <ChevronDown size={12} style={{ display: 'none' }} />
              </label>
            </div>

            <button type="button" className={`btn-mastodon-tool ${cwActive ? 'cw-active' : ''}`} onClick={() => { setCwActive(!cwActive); if (cwActive) setWarningText(''); }} title="Content warning">
              <span>CW</span>
            </button>

            <AiAssistButton postText={content} onSelectHashtags={handleAiHashtags} />
          </div>

          <div className="mastodon-toolbar-right">
            <span className={`mastodon-char-counter ${charsRemaining < 20 ? (charsRemaining < 0 ? 'warning' : 'near-limit') : ''}`}>
              {charsRemaining}
            </span>
            <button type="submit" className="btn-mastodon-publish" disabled={!canPost}>
              {submitting ? '...' : replyToPostId ? copy.reply : copy.publish}
            </button>
          </div>
        </div>

        {emojiOpen && (
          <div className="compose-emoji-panel simple-compose-panel">
            {emojis.map((emoji) => (
              <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}>{emoji}</button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePostBox;
