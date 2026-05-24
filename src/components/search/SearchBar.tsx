import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  clearAriaLabel?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search posts, users, hashtags...',
  clearAriaLabel = 'Clear search',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onClear();
  }, [onClear]);

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar-container">
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && localValue !== value) {
              onChange(localValue);
            }
          }}
          placeholder={placeholder}
          className="search-bar-input"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="search-bar-clear"
            aria-label={clearAriaLabel}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <style>{`
        .search-bar-wrapper {
          width: 100%;
        }

        .search-bar-container {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .search-bar-icon {
          position: absolute;
          left: 16px;
          color: var(--text-dimmed);
          pointer-events: none;
          transition: color 0.2s ease;
          z-index: 1;
        }

        .search-bar-input {
          width: 100%;
          padding: 12px 42px 12px 48px;
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
          border-radius: 9999px;
          color: var(--text-main);
          font-size: 15px;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-bar-input:focus {
          background-color: var(--bg-app);
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
        }

        .search-bar-input:focus ~ .search-bar-icon {
          color: var(--primary);
        }

        .search-bar-clear {
          position: absolute;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-dimmed);
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }

        .search-bar-clear:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--text-main);
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
