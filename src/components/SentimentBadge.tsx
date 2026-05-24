import React, { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Loader2 } from 'lucide-react';
import { AIService } from '../services/ai.service';
import type { SentimentResult } from '../services/ai.service';

interface SentimentBadgeProps {
  postText: string;
  postId: number;
}

const SentimentBadge: React.FC<SentimentBadgeProps> = ({ postText, postId }) => {
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const cacheKey = `sentiment:${postId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setSentiment(JSON.parse(cached));
        return;
      } catch { /* ignore */ }
    }
  }, [postId]);

  const handleAnalyze = async () => {
    if (sentiment || loading) return;
    setLoading(true);
    setError(false);

    try {
      const task = await AIService.analyzeSentiment(postText);
      const interval = setInterval(async () => {
        try {
          const status = await AIService.getTaskStatus(task.id);
          if (status.status === 'completed') {
            clearInterval(interval);
            const result = status.output_data as SentimentResult;
            setSentiment(result);
            sessionStorage.setItem(`sentiment:${postId}`, JSON.stringify(result));
            setLoading(false);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            setError(true);
            setLoading(false);
          }
        } catch {
          clearInterval(interval);
          setError(true);
          setLoading(false);
        }
      }, 2000);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  const config = sentiment
    ? {
        positive: { icon: <Smile size={14} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Positive' },
        negative: { icon: <Frown size={14} />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Negative' },
        neutral: { icon: <Meh size={14} />, color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: 'Neutral' },
      }[sentiment.sentiment]
    : null;

  return (
    <div className="sentiment-badge-wrapper">
      {sentiment && config ? (
        <div
          className="sentiment-badge"
          style={{ color: config.color, background: config.bg, borderColor: config.color }}
          title={`Sentiment: ${config.label} (${Math.round(sentiment.confidence * 100)}%)`}
        >
          {config.icon}
          <span>{config.label}</span>
          {sentiment.mood_tags.length > 0 && (
            <span className="sentiment-moods">
              {sentiment.mood_tags.map((tag) => (
                <span key={tag} className="sentiment-mood-tag">{tag}</span>
              ))}
            </span>
          )}
        </div>
      ) : loading ? (
        <button className="sentiment-btn loading" disabled>
          <Loader2 size={12} className="spinning-icon" />
        </button>
      ) : error ? (
        <button className="sentiment-btn error" onClick={handleAnalyze} title="Retry sentiment analysis">
          <Meh size={12} />
        </button>
      ) : (
        <button className="sentiment-btn" onClick={handleAnalyze} title="Analizo sentimentin me AI">
          <Smile size={12} />
        </button>
      )}

      <style>{`
        .sentiment-badge-wrapper {
          display: inline-flex;
          align-items: center;
        }

        .sentiment-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 11px;
          font-weight: 600;
        }

        .sentiment-moods {
          display: flex;
          gap: 2px;
          margin-left: 2px;
        }

        .sentiment-mood-tag {
          font-size: 10px;
          opacity: 0.7;
        }

        .sentiment-btn {
          background: none;
          border: 1px solid var(--border, #2d2f45);
          border-radius: 999px;
          padding: 2px 6px;
          cursor: pointer;
          color: var(--text-dimmed, #9ca3af);
          display: flex;
          align-items: center;
          transition: all 0.15s ease;
        }

        .sentiment-btn:hover {
          border-color: var(--primary, #6366f1);
          color: var(--primary, #6366f1);
        }

        .sentiment-btn.loading {
          cursor: wait;
        }

        .sentiment-btn.error {
          border-color: #ef4444;
          color: #ef4444;
        }

        .spinning-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SentimentBadge;
