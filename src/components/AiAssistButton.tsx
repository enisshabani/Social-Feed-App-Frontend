import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Loader2, Hash, X } from 'lucide-react';
import { AIService } from '../services/ai.service';

interface AiAssistButtonProps {
  postText: string;
  onSelectHashtags: (hashtags: string[]) => void;
}

const AiAssistButton: React.FC<AiAssistButtonProps> = ({ postText, onSelectHashtags }) => {
  const [loading, setLoading] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleAskAI = async () => {
    if (!postText.trim()) return;
    setLoading(true);
    setError('');
    setSuggestedHashtags([]);

    try {
      const task = await AIService.suggestHashtags(postText);

      pollingRef.current = setInterval(async () => {
        try {
          const status = await AIService.getTaskStatus(task.id);
          if (status.status === 'completed') {
            clearInterval(pollingRef.current!);
            const hashtags = (status.output_data as { hashtags?: string[] })?.hashtags || [];
            setSuggestedHashtags(hashtags);
            setShowDropdown(true);
            setLoading(false);
          } else if (status.status === 'failed') {
            clearInterval(pollingRef.current!);
            setError(status.error_message || 'AI suggestion failed');
            setLoading(false);
          }
        } catch {
          clearInterval(pollingRef.current!);
          setError('Failed to check task status');
          setLoading(false);
        }
      }, 2000);
    } catch {
      setError('Failed to start AI suggestion');
      setLoading(false);
    }
  };

  const handleSelectTag = (tag: string) => {
    onSelectHashtags([tag]);
    setSuggestedHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSelectAll = () => {
    onSelectHashtags(suggestedHashtags);
    setSuggestedHashtags([]);
    setShowDropdown(false);
  };

  return (
    <div className="ai-assist-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="btn-mastodon-tool ai-assist-btn"
        onClick={handleAskAI}
        disabled={loading || !postText.trim()}
        title="Sugjero hashtags me AI"
      >
        {loading ? (
          <Loader2 size={18} className="spinning-icon" />
        ) : (
          <Wand2 size={18} />
        )}
      </button>

      {showDropdown && suggestedHashtags.length > 0 && (
        <div className="ai-dropdown">
          <div className="ai-dropdown-header">
            <span>Hashtags të sugjeruar</span>
            <div className="ai-dropdown-actions">
              <button className="ai-select-all" onClick={handleSelectAll}>
                Shto të gjitha
              </button>
              <button className="ai-close" onClick={() => setShowDropdown(false)}>
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="ai-hashtag-chips">
            {suggestedHashtags.map((tag) => (
              <button
                key={tag}
                className="ai-hashtag-chip"
                onClick={() => handleSelectTag(tag)}
              >
                <Hash size={12} />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="ai-error-tooltip">{error}</div>
      )}

      <style>{`
        .ai-assist-wrapper {
          position: relative;
          display: inline-flex;
        }

        .ai-assist-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .spinning-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ai-dropdown {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 8px;
          min-width: 240px;
          max-width: 320px;
          background: var(--bg-primary, #1a1b2f);
          border: 1px solid var(--border, #2d2f45);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 100;
          padding: 12px;
        }

        .ai-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dimmed, #9ca3af);
        }

        .ai-dropdown-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-select-all {
          font-size: 12px;
          color: var(--primary, #6366f1);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .ai-select-all:hover {
          background: rgba(99,102,241,0.15);
        }

        .ai-close {
          background: none;
          border: none;
          color: var(--text-dimmed, #9ca3af);
          cursor: pointer;
          padding: 2px;
          display: flex;
          border-radius: 4px;
        }

        .ai-close:hover {
          background: rgba(255,255,255,0.1);
        }

        .ai-hashtag-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ai-hashtag-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--primary-light, rgba(99,102,241,0.15));
          color: var(--primary, #6366f1);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: 999px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ai-hashtag-chip:hover {
          background: var(--primary, #6366f1);
          color: #fff;
        }

        .ai-error-tooltip {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 4px;
          padding: 6px 10px;
          background: #ef4444;
          color: #fff;
          font-size: 12px;
          border-radius: 6px;
          white-space: nowrap;
          z-index: 100;
        }
      `}</style>
    </div>
  );
};

export default AiAssistButton;
