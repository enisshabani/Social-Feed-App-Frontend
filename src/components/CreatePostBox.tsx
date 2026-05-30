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
import { imageFileToDataUrl } from '../utils/mediaFiles';
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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollActive, setPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [cropX, setCropX] = useState(50);
  const [cropY, setCropY] = useState(50);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropBox, setCropBox] = useState({ x: 12, y: 12, width: 76, height: 76 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const cropStageRef = useRef<HTMLDivElement>(null);
  const cropDragRef = useRef({
    pointerId: 0,
    mode: 'move' as string,
    startClientX: 0,
    startClientY: 0,
    startX: 12,
    startY: 12,
    startWidth: 76,
    startHeight: 76,
  });
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

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const resetCrop = () => {
    setCropBox({ x: 12, y: 12, width: 76, height: 76 });
    setCropX(50);
    setCropY(50);
    setCropZoom(1);
  };

  const updateCropFromBox = (box: { x: number; y: number; width: number; height: number }) => {
    setCropX(clamp(box.x + (box.width / 2), 0, 100));
    setCropY(clamp(box.y + (box.height / 2), 0, 100));
  };

  const beginCropDrag = (mode: string, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    cropDragRef.current = {
      pointerId: e.pointerId,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: cropBox.x,
      startY: cropBox.y,
      startWidth: cropBox.width,
      startHeight: cropBox.height,
    };
    setIsDraggingCrop(true);
  };

  const moveCropDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop || e.pointerId !== cropDragRef.current.pointerId) return;
    const rect = cropStageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const deltaX = ((e.clientX - cropDragRef.current.startClientX) / rect.width) * 100;
    const deltaY = ((e.clientY - cropDragRef.current.startClientY) / rect.height) * 100;

    const { mode, startX, startY, startWidth, startHeight } = cropDragRef.current;

    if (mode === 'move') {
      const nextBox = {
        ...cropBox,
        x: clamp(startX + deltaX, 0, 100 - cropBox.width),
        y: clamp(startY + deltaY, 0, 100 - cropBox.height),
      };
      setCropBox(nextBox);
      updateCropFromBox(nextBox);
      return;
    }

    let nextX = startX;
    let nextY = startY;
    let nextW = startWidth;
    let nextH = startHeight;

    if (mode.includes('e')) {
      nextW = clamp(startWidth + deltaX, 10, 100 - startX);
    }
    if (mode.includes('s')) {
      nextH = clamp(startHeight + deltaY, 10, 100 - startY);
    }
    if (mode.includes('w')) {
      const newX = clamp(startX + deltaX, 0, startX + startWidth - 10);
      nextW = startWidth + (startX - newX);
      nextX = newX;
    }
    if (mode.includes('n')) {
      const newY = clamp(startY + deltaY, 0, startY + startHeight - 10);
      nextH = startHeight + (startY - newY);
      nextY = newY;
    }

    const nextBox = { x: nextX, y: nextY, width: nextW, height: nextH };
    setCropBox(nextBox);
    updateCropFromBox(nextBox);
  };

  const endCropDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== cropDragRef.current.pointerId) return;
    setIsDraggingCrop(false);
  };

  const resetComposer = () => {
    setContent('');
    setMediaUrl('');
    setMediaType('image');
    setWarningText('');
    setCwActive(false);
    setPollActive(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setEmojiOpen(false);
    resetCrop();
    setIsDraggingCrop(false);
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
    const mediaMeta = mediaType === 'image'
      ? { cropX, cropY, cropZoom: Number((cropZoom * (100 / Math.min(cropBox.width, cropBox.height))).toFixed(2)), cropWidth: cropBox.width, cropHeight: cropBox.height }
      : undefined;
    const media: MediaInput[] = hasMedia ? [{ url: normalizedMediaUrl, media_type: mediaType, meta: mediaMeta }] : [];
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
      if (file.type.startsWith('image/')) {
        setMediaUrl(await imageFileToDataUrl(file));
        setMediaType('image');
        resetCrop();
      } else {
        const uploaded = await PostService.uploadPostMedia(file);
        setMediaUrl(uploaded.url);
        setMediaType(uploaded.media_type);
      }

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

            {(hasMedia || uploadingMedia) && (
              <div className="compose-media-panel simple-compose-panel">
                <div className="compose-panel-header" style={{ justifyContent: 'space-between' }}>
                  <span className="text-sm font-semibold">{uploadingMedia ? t('create_post_uploading') + '...' : 'Media Preview'}</span>
                  <button
                    type="button"
                    className="compose-media-close"
                    title="Remove media"
                    onClick={() => {
                      setMediaUrl('');
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                {normalizedMediaUrl && isValidMediaUrl(normalizedMediaUrl) && (
                  <div
                    ref={cropStageRef}
                    className={`compose-media-preview ${mediaType === 'image' ? 'is-croppable' : ''} ${isDraggingCrop ? 'is-dragging' : ''}`}
                    onPointerMove={moveCropDrag}
                    onPointerUp={endCropDrag}
                    onPointerCancel={endCropDrag}
                  >
                    {mediaType === 'video' ? (
                      <video src={resolveAssetUrl(normalizedMediaUrl)} controls />
                    ) : (
                      <>
                        <img
                          src={resolveAssetUrl(normalizedMediaUrl)}
                          alt="Media preview"
                          draggable={false}
                          style={{
                            transform: `scale(${cropZoom})`,
                          }}
                        />
                        <div className="compose-crop-scrim" />
                        <div
                          className="compose-crop-box"
                          style={{
                            left: `${cropBox.x}%`,
                            top: `${cropBox.y}%`,
                            width: `${cropBox.width}%`,
                            height: `${cropBox.height}%`,
                          }}
                          onPointerDown={(e) => beginCropDrag('move', e)}
                        >
                          <span className="compose-crop-grid" />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'nw-resize', top: -8, left: -8, right: 'auto', bottom: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('nw', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'n-resize', top: -8, left: '50%', transform: 'translateX(-50%)', right: 'auto', bottom: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('n', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'ne-resize', top: -8, right: -8, left: 'auto', bottom: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('ne', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'e-resize', top: '50%', right: -8, transform: 'translateY(-50%)', left: 'auto', bottom: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('e', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'se-resize', bottom: -8, right: -8, left: 'auto', top: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('se', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 's-resize', bottom: -8, left: '50%', transform: 'translateX(-50%)', right: 'auto', top: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('s', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'sw-resize', bottom: -8, left: -8, right: 'auto', top: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('sw', e)}
                          />
                          <span
                            className="compose-crop-resize"
                            style={{ cursor: 'w-resize', top: '50%', left: -8, transform: 'translateY(-50%)', right: 'auto', bottom: 'auto' }}
                            onPointerDown={(e) => beginCropDrag('w', e)}
                          />
                        </div>
                        <div className="compose-crop-hint">Move or resize crop</div>
                      </>
                    )}
                  </div>
                )}
                {normalizedMediaUrl && isValidMediaUrl(normalizedMediaUrl) && mediaType === 'image' && (
                  <div className="compose-crop-controls">
                    <label>
                      <span>Zoom</span>
                      <input type="range" min="0.5" max="3" step="0.05" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} />
                    </label>
                    <button type="button" onClick={resetCrop}>
                      Reset
                    </button>
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
            <button type="button" className={`btn-mastodon-tool ${hasMedia ? 'active' : ''}`} title="Photo or video" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia}>
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
