import React, { useRef, useState } from 'react';
import { Globe, EyeOff, Lock, ChevronDown, Paperclip, BarChart2, X, Image, Video } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { MediaInput } from '../services/post.service';
import { getLoggedInUser } from './SidebarLeft';
import AiAssistButton from './AiAssistButton';
import { useLanguage } from '../context/LanguageContext';

interface CreatePostBoxProps {
  onPostCreated: () => void;
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
  const { language } = useLanguage();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [cwActive, setCwActive] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const characterLimit = 500;
  const combinedLength = content.length + (cwActive ? warningText.length : 0);
  const isOverLimit = combinedLength > characterLimit;
  const charsRemaining = characterLimit - combinedLength;

  const normalizedMediaUrl = mediaUrl.trim();
  const hasMedia = normalizedMediaUrl.length > 0;
  const canPost = (content.trim().length > 0 || hasMedia) && !isOverLimit && !submitting && (!cwActive || warningText.trim().length > 0);

  const isValidMediaUrl = (value: string) => {
    if (value.startsWith('/uploads/')) return true;

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const resolveMediaUrl = (value: string) => {
    if (!value.startsWith('/')) return value;
    const apiRoot = (import.meta.env?.VITE_API_URL || 'http://localhost:8000')
      .replace(/\/+$/, '')
      .replace(/\/api\/v1$/i, '');
    return `${apiRoot}${value}`;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setSubmitting(true);

    const finalContent = cwActive && warningText.trim()
      ? `CW: ${warningText.trim()}\n\n---\n\n${content}`
      : content;
    const media: MediaInput[] = hasMedia ? [{ url: normalizedMediaUrl, media_type: mediaType }] : [];

    if (hasMedia && !isValidMediaUrl(normalizedMediaUrl)) {
      alert('Please paste a valid http or https media URL.');
      setSubmitting(false);
      return;
    }

    try {
      await PostService.createPost(
        finalContent || (mediaType === 'image' ? 'Shared an image' : 'Shared a video'),
        visibility,
        replyToPostId,
        media
      );
      setContent('');
      setMediaUrl('');
      setMediaType('image');
      setShowMediaInput(false);
      setWarningText('');
      setCwActive(false);
      onPostCreated();
      // Fire global event so Feed.tsx auto-refreshes
      window.dispatchEvent(new Event('postCreated'));
    } catch (err) {
      alert('Gabim gjatÃ« krijimit tÃ« postimit.');
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
    try {
      const uploaded = await PostService.uploadPostMedia(file);
      setMediaUrl(uploaded.url);
      setMediaType(uploaded.media_type);
      setShowMediaInput(true);
    } catch {
      alert('Could not upload that media file.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  const userInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U';
  const copy = {
    placeholder: placeholder || (language === 'sq' ? 'Cfare po mendoni?' : 'What are you thinking?'),
    publish: language === 'sq' ? 'Publiko' : 'Post',
    reply: language === 'sq' ? 'Pergjigju' : 'Reply',
    warningPlaceholder: language === 'sq' ? 'Shkruaj paralajmerimin ketu...' : 'Write a content warning here...',
  };

  return (
    <div className="create-post-box mastodon-compose">
      <form onSubmit={handlePostSubmit}>
        <div className="mastodon-compose-row">
          {/* Avatar Column */}
          <div className="compose-avatar-column">
            <div className="compose-avatar" title={`KyÃ§ur si @${currentUser?.username || 'user'}`}>
              {userInitial}
            </div>
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
                      Image
                    </button>
                    <button
                      type="button"
                      className={`compose-media-type-btn ${mediaType === 'video' ? 'active' : ''}`}
                      onClick={() => setMediaType('video')}
                    >
                      <Video size={15} />
                      Video
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
                    {uploadingMedia ? 'Uploading...' : 'Upload from PC'}
                  </button>
                  <span>or paste a link above</span>
                </div>
                {normalizedMediaUrl && isValidMediaUrl(normalizedMediaUrl) && (
                  <div className="compose-media-preview">
                    {mediaType === 'video' ? (
                      <video src={resolveMediaUrl(normalizedMediaUrl)} controls />
                    ) : (
                      <img src={resolveMediaUrl(normalizedMediaUrl)} alt="Media preview" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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

            {/* Poll */}
            <button
              type="button"
              className="btn-mastodon-tool"
              title="Polls are not available yet"
              disabled
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
                  <option value="public" style={{ background: '#282c37' }}>Publik</option>
                  <option value="private" style={{ background: '#282c37' }}>VetÃ«m NdjekÃ«sit</option>
                  <option value="unlisted" style={{ background: '#282c37' }}>Jo-publik</option>
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


