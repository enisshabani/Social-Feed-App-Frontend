import React, { useState } from 'react';
import { Globe, EyeOff, Lock, ChevronDown, Paperclip, BarChart2 } from 'lucide-react';
import { PostService } from '../services/post.service';
import { getLoggedInUser } from './SidebarLeft';

interface CreatePostBoxProps {
  onPostCreated: () => void;
  replyToPostId?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  onPostCreated,
  replyToPostId,
  placeholder = "Çfarë po mendoni?",
  autoFocus = false,
}) => {
  const currentUser = getLoggedInUser();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [cwActive, setCwActive] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const characterLimit = 500;
  const combinedLength = content.length + (cwActive ? warningText.length : 0);
  const isOverLimit = combinedLength > characterLimit;
  const charsRemaining = characterLimit - combinedLength;

  const canPost = content.trim().length > 0 && !isOverLimit && !submitting && (!cwActive || warningText.trim().length > 0);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setSubmitting(true);

    const finalContent = cwActive && warningText.trim()
      ? `CW: ${warningText.trim()}\n\n---\n\n${content}`
      : content;

    try {
      await PostService.createPost(finalContent, visibility, replyToPostId);
      setContent('');
      setWarningText('');
      setCwActive(false);
      onPostCreated();
      // Fire global event so Feed.tsx auto-refreshes
      window.dispatchEvent(new Event('postCreated'));
    } catch (err) {
      alert('Gabim gjatë krijimit të postimit.');
    } finally {
      setSubmitting(false);
    }
  };

  const userInitial = currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="create-post-box mastodon-compose">
      <form onSubmit={handlePostSubmit}>
        <div className="mastodon-compose-row">
          {/* Avatar Column */}
          <div className="compose-avatar-column">
            <div className="compose-avatar" title={`Kyçur si @${currentUser?.username || 'user'}`}>
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
                  placeholder="Shkruaj paralajmërimin (spoiler) këtu..."
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
                placeholder={placeholder}
                rows={replyToPostId ? 2 : 4}
                className="mastodon-post-textarea"
                autoFocus={autoFocus}
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mastodon-toolbar">
          <div className="mastodon-toolbar-left">
            {/* Attachment */}
            <button
              type="button"
              className="btn-mastodon-tool"
              title="Shto media"
              onClick={() => alert("Kjo veçori do të shtohet së shpejti!")}
            >
              <Paperclip size={18} />
            </button>

            {/* Poll */}
            <button
              type="button"
              className="btn-mastodon-tool"
              title="Krijo sondazh"
              onClick={() => alert("Sondazhet do të shtohen së shpejti!")}
            >
              <BarChart2 size={18} />
            </button>

            {/* Visibility dropdown */}
            <div className="custom-select-wrapper">
              <label className="select-icon-label" title="Dukshmëria e postimit">
                {visibility === 'public' && <Globe size={18} />}
                {visibility === 'private' && <Lock size={18} />}
                {visibility === 'unlisted' && <EyeOff size={18} />}
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="visibility-select"
                >
                  <option value="public" style={{ background: '#282c37' }}>Publik</option>
                  <option value="private" style={{ background: '#282c37' }}>Vetëm Ndjekësit</option>
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
              title="Paralajmërim për Përmbajtjen (CW)"
            >
              <span>CW</span>
            </button>
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
              {submitting ? '...' : replyToPostId ? 'Përgjigju' : 'Publiko'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePostBox;
