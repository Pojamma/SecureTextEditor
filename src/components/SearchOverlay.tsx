import React, { useState, useEffect, useRef } from 'react';
import './SearchOverlay.css';

export interface SearchOverlayProps {
  content: string;
  onClose: () => void;
  onNavigate?: (position: number, length: number) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  content,
  onClose,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find all matches whenever search term or options change
  useEffect(() => {
    if (!searchTerm) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const foundMatches: number[] = [];
    let searchText = content;
    let term = searchTerm;

    // Apply case sensitivity
    if (!caseSensitive) {
      searchText = content.toLowerCase();
      term = searchTerm.toLowerCase();
    }

    // Find all occurrences
    if (wholeWord) {
      // Whole word matching using regex
      const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, caseSensitive ? 'g' : 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        foundMatches.push(match.index);
      }
    } else {
      // Simple substring matching
      let index = searchText.indexOf(term);
      while (index !== -1) {
        foundMatches.push(index);
        index = searchText.indexOf(term, index + 1);
      }
    }

    setMatches(foundMatches);
    setCurrentMatchIndex(foundMatches.length > 0 ? 0 : -1);

    // Navigate to first match
    if (foundMatches.length > 0 && onNavigate) {
      onNavigate(foundMatches[0], term.length);
    }
  }, [searchTerm, caseSensitive, wholeWord, content, onNavigate]);

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const goToNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    if (onNavigate) {
      onNavigate(matches[nextIndex], searchTerm.length);
    }
  };

  const goToPrevious = () => {
    if (matches.length === 0) return;
    const prevIndex = currentMatchIndex - 1 < 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    if (onNavigate) {
      onNavigate(matches[prevIndex], searchTerm.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevious();
      } else {
        goToNext();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="search-overlay">
      <div className="search-container">
        <div className="search-input-group">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Find in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="search-close-button"
            onClick={onClose}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="search-controls">
          <div className="search-options">
            <label className="search-checkbox">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span>Aa</span>
              <span className="tooltip">Case sensitive</span>
            </label>
            <label className="search-checkbox">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
              />
              <span>Ab</span>
              <span className="tooltip">Whole word</span>
            </label>
          </div>

          <div className="search-navigation">
            <span className="match-count">
              {matches.length > 0
                ? `${currentMatchIndex + 1} of ${matches.length}`
                : searchTerm
                ? 'No matches'
                : ''}
            </span>
            <button
              className="nav-button"
              onClick={goToPrevious}
              disabled={matches.length === 0}
              title="Previous match (Shift+Enter)"
            >
              ↑
            </button>
            <button
              className="nav-button"
              onClick={goToNext}
              disabled={matches.length === 0}
              title="Next match (Enter)"
            >
              ↓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
