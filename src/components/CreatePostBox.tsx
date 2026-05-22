import React, { useState, useEffect } from 'react';
import { Sparkles, Save, BookOpen, Globe, EyeOff, Lock, ChevronDown, Check } from 'lucide-react';
import { PostService } from '../services/post.service';
import type { Draft } from '../services/post.service';

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
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [refining, setRefining] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('casual');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDraftsMenu, setShowDraftsMenu] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const characterLimit = 5000;
  const isOverLimit = content.length > characterLimit;
  const canPost = content.trim().length > 0 && !isOverLimit && !refining;

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const allDrafts = await PostService.listDrafts();
      setDrafts(allDrafts);
    } catch (e) {
      console.error('Gabim gjatë marrjes së drafteve:', e);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPost) return;

    try {
      await PostService.createPost(content, visibility, replyToPostId);
      setContent('');
      loadDrafts(); // Reload drafts in case any are modified
      onPostCreated();
    } catch (err) {
      alert('Gabim gjatë krijimit të postimit.');
    }
  };

  const handleAIRefine = async () => {
    if (!content.trim()) return;
    setRefining(true);
    setShowStyleMenu(false);
    try {
      const refinedText = await PostService.refineAIText(content, selectedStyle);
      setContent(refinedText);
    } catch (err) {
      alert('Gabim gjatë përmirësimit me AI.');
    } finally {
      setRefining(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    setSavingDraft(true);
    try {
      await PostService.saveDraft(content);
      loadDrafts();
      alert('Drafti u ruajt me sukses!');
    } catch (e) {
      alert('Gabim gjatë ruajtjes së draftit.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleLoadDraft = async (draft: Draft) => {
    setContent(draft.content);
    setShowDraftsMenu(false);
    // Delete draft after load or keep it? We can publish or just let user publish later.
    // If they publish, it will delete the draft via our backend publish endpoint.
  };

  const aiStyles = [
    { id: 'casual', label: 'Jashtëzakonshëm' },
    { id: 'professional', label: 'Profesional' },
    { id: 'witty', label: 'Humoristik' },
    { id: 'concise', label: 'Konciz' },
  ];

  return (
    <div className="create-post-box glass-panel">
      <form onSubmit={handlePostSubmit}>
        {/* Input Text Area */}
        <div className="textarea-wrapper">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={replyToPostId ? 2 : 4}
            className="post-textarea"
            autoFocus={autoFocus}
            disabled={refining}
          />
        </div>

        {/* Dynamic Character Count Line */}
        <div className="character-count-bar">
          <span className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
            {content.length} / {characterLimit} shkronja
          </span>
        </div>

        {/* Toolbar & Buttons */}
        <div className="create-post-toolbar">
          <div className="toolbar-left-options">
            {/* Visibility Settings Dropdown */}
            <div className="custom-select-wrapper">
              <label className="select-icon-label" title="Dukshmëria e postimit">
                {visibility === 'public' && <Globe size={16} />}
                {visibility === 'private' && <Lock size={16} />}
                {visibility === 'unlisted' && <EyeOff size={16} />}
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="visibility-select"
                >
                  <option value="public">Publik</option>
                  <option value="private">Vetëm Ndjekësit</option>
                  <option value="unlisted">Jo-publik</option>
                </select>
                <ChevronDown size={12} className="select-chevron" />
              </label>
            </div>

            {/* AI Refine Popover Toggle */}
            <div className="ai-refine-container">
              <button
                type="button"
                className={`btn-toolbar btn-ai-sparkle ${refining ? 'shimmering' : ''}`}
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                disabled={!content.trim() || refining}
                title="Përmirëso me AI"
              >
                <Sparkles size={16} />
                <span>AI Sparkle</span>
              </button>

              {showStyleMenu && (
                <div className="style-dropdown glass-panel">
                  <div className="dropdown-title">Zgjidh stilin e AI:</div>
                  {aiStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={`style-option-btn ${selectedStyle === style.id ? 'active' : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <span>{style.label}</span>
                      {selectedStyle === style.id && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-primary refine-submit-btn"
                    onClick={handleAIRefine}
                  >
                    Rishkruaj Textin
                  </button>
                </div>
              )}
            </div>

            {/* Drafts Tools */}
            <div className="drafts-container">
              <button
                type="button"
                className="btn-toolbar"
                onClick={handleSaveDraft}
                disabled={!content.trim() || savingDraft}
                title="Ruaj si Draft"
              >
                <Save size={16} />
              </button>

              {drafts.length > 0 && (
                <div className="load-drafts-dropdown-wrapper">
                  <button
                    type="button"
                    className="btn-toolbar indicator-dot"
                    onClick={() => setShowDraftsMenu(!showDraftsMenu)}
                    title="Shiko Draftet"
                  >
                    <BookOpen size={16} />
                    <span className="dot-badge"></span>
                  </button>

                  {showDraftsMenu && (
                    <div className="drafts-dropdown glass-panel">
                      <div className="dropdown-title">Draftet e Ruajtura ({drafts.length}):</div>
                      <div className="drafts-list">
                        {drafts.map((draft) => (
                          <div
                            key={draft.id}
                            className="draft-item"
                            onClick={() => handleLoadDraft(draft)}
                          >
                            <div className="draft-preview">{draft.content}</div>
                            <div className="draft-date">
                              {new Date(draft.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-post-btn"
            disabled={!canPost}
          >
            {refining ? 'Po mendohem...' : replyToPostId ? 'Përgjigju' : 'Posto'}
          </button>
        </div>
      </form>

      <style>{`
        .create-post-box {
          padding: 20px;
          margin-bottom: 20px;
          border-radius: var(--radius-md);
        }

        .textarea-wrapper {
          position: relative;
          width: 100%;
        }

        .post-textarea {
          width: 100%;
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 18px;
          font-family: inherit;
          resize: none;
          outline: none;
          padding: 8px 0;
          line-height: 1.5;
        }

        .post-textarea::placeholder {
          color: var(--text-dimmed);
        }

        .character-count-bar {
          display: flex;
          justify-content: flex-end;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .char-count {
          font-size: 12px;
          color: var(--text-dimmed);
        }

        .char-count.over-limit {
          color: var(--error);
          font-weight: bold;
        }

        .create-post-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 14px;
        }

        .toolbar-left-options {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Toolbar icons/buttons styling */
        .btn-toolbar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-round);
          border: none;
          background-color: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-toolbar:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.08);
          color: var(--text-main);
        }

        .btn-toolbar:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* Sparkle Premium Button */
        .btn-ai-sparkle {
          width: auto;
          height: 36px;
          border-radius: 9999px;
          padding: 0 14px;
          gap: 6px;
          color: var(--primary);
          background-color: var(--primary-light);
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .btn-ai-sparkle:hover:not(:disabled) {
          background-color: rgba(59, 130, 246, 0.2);
          color: #fff;
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }

        @keyframes shimmer-fast {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .shimmering {
          background: linear-gradient(90deg, #1d4ed8 25%, #3b82f6 50%, #1d4ed8 75%);
          background-size: 200% 100%;
          animation: shimmer-fast 1.2s infinite;
          color: white !important;
          border: none;
        }

        /* Visibility Custom Dropdown */
        .custom-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .select-icon-label {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 12px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 9999px;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .select-icon-label:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: var(--text-main);
        }

        .visibility-select {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .select-chevron {
          margin-left: 2px;
          color: var(--text-dimmed);
        }

        /* AI Refine Dropdown Menu */
        .ai-refine-container, .drafts-container {
          position: relative;
        }

        .style-dropdown, .drafts-dropdown {
          position: absolute;
          top: 42px;
          left: 0;
          width: 220px;
          background: var(--bg-panel-solid);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow);
          padding: 10px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dropdown-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-dimmed);
          padding: 4px 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .style-option-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s ease;
        }

        .style-option-btn:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }

        .style-option-btn.active {
          color: var(--primary);
          font-weight: 600;
          background-color: var(--primary-light);
        }

        .check-icon {
          color: var(--primary);
        }

        .refine-submit-btn {
          margin-top: 6px;
          font-size: 13px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
        }

        /* Drafts List Dropdown */
        .drafts-dropdown {
          width: 280px;
          max-height: 300px;
          overflow-y: auto;
        }

        .drafts-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .draft-item {
          padding: 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--border);
        }

        .draft-item:last-child {
          border-bottom: none;
        }

        .draft-item:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }

        .draft-preview {
          font-size: 13px;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .draft-date {
          font-size: 10px;
          color: var(--text-dimmed);
          margin-top: 4px;
        }

        .indicator-dot {
          position: relative;
        }

        .dot-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          border-radius: var(--radius-round);
          background-color: var(--primary);
          border: 2px solid var(--bg-panel-solid);
        }

        .submit-post-btn {
          font-size: 14px;
          padding: 8px 20px;
        }
      `}</style>
    </div>
  );
};

export default CreatePostBox;
