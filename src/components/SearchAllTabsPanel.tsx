import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore, SearchResult } from '@/stores/uiStore';
import './SearchAllTabsPanel.css';

export const SearchAllTabsPanel: React.FC = () => {
  const { documents, setActiveDocument } = useDocumentStore();
  const {
    searchAllTabsQuery,
    searchAllTabsResults,
    searchAllTabsCaseSensitive,
    searchAllTabsWholeWord,
    setSearchAllTabsQuery,
    setSearchAllTabsResults,
    setSearchAllTabsOptions,
    hideSearchAllTabs,
  } = useUIStore();

  const [caseSensitive, setCaseSensitive] = useState(searchAllTabsCaseSensitive);
  const [wholeWord, setWholeWord] = useState(searchAllTabsWholeWord);

  // Perform search whenever query or options change
  useEffect(() => {
    if (!searchAllTabsQuery) {
      setSearchAllTabsResults([]);
      return;
    }

    const results: SearchResult[] = [];

    // Search through all documents
    documents.forEach((doc) => {
      const lines = doc.content.split('\n');
      let searchText = doc.content;
      let term = searchAllTabsQuery;

      // Apply case sensitivity
      if (!caseSensitive) {
        searchText = doc.content.toLowerCase();
        term = searchAllTabsQuery.toLowerCase();
      }

      // Find matches
      if (wholeWord) {
        // Whole word matching using regex
        const regex = new RegExp(
          `\\b${escapeRegExp(term)}\\b`,
          caseSensitive ? 'g' : 'gi'
        );
        let match;
        while ((match = regex.exec(doc.content)) !== null) {
          const lineNumber = doc.content.substring(0, match.index).split('\n').length;
          const lineText = lines[lineNumber - 1];
          const lineStartIndex = doc.content.substring(0, match.index).lastIndexOf('\n') + 1;
          const matchIndex = match.index - lineStartIndex;

          results.push({
            documentId: doc.id,
            documentName: doc.metadata.filename,
            lineNumber,
            lineText,
            matchIndex,
            matchLength: term.length,
          });
        }
      } else {
        // Simple substring matching
        let index = searchText.indexOf(term);
        while (index !== -1) {
          const lineNumber = searchText.substring(0, index).split('\n').length;
          const lineText = lines[lineNumber - 1];
          const lineStartIndex = searchText.substring(0, index).lastIndexOf('\n') + 1;
          const matchIndex = index - lineStartIndex;

          results.push({
            documentId: doc.id,
            documentName: doc.metadata.filename,
            lineNumber,
            lineText,
            matchIndex,
            matchLength: term.length,
          });

          index = searchText.indexOf(term, index + 1);
        }
      }
    });

    setSearchAllTabsResults(results);
  }, [searchAllTabsQuery, caseSensitive, wholeWord, documents, setSearchAllTabsResults]);

  const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleCaseSensitiveToggle = () => {
    setCaseSensitive(!caseSensitive);
    setSearchAllTabsOptions(!caseSensitive, wholeWord);
  };

  const handleWholeWordToggle = () => {
    setWholeWord(!wholeWord);
    setSearchAllTabsOptions(caseSensitive, !wholeWord);
  };

  const handleResultClick = (result: SearchResult) => {
    // Switch to the document
    setActiveDocument(result.documentId);
    // Close search panel
    hideSearchAllTabs();
    // Note: Actual navigation to line would require editor integration
  };

  // Group results by document
  const resultsByDocument = searchAllTabsResults.reduce((acc, result) => {
    if (!acc[result.documentId]) {
      acc[result.documentId] = [];
    }
    acc[result.documentId].push(result);
    return {};
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="search-all-tabs-panel">
      <div className="search-all-tabs-header">
        <h3>Search All Tabs</h3>
        <button
          className="search-all-tabs-close"
          onClick={hideSearchAllTabs}
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      <div className="search-all-tabs-input-container">
        <input
          type="text"
          className="search-all-tabs-input"
          placeholder="Find in all tabs..."
          value={searchAllTabsQuery}
          onChange={(e) => setSearchAllTabsQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="search-all-tabs-options">
        <label className="search-all-tabs-checkbox">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={handleCaseSensitiveToggle}
          />
          <span>Case sensitive</span>
        </label>
        <label className="search-all-tabs-checkbox">
          <input
            type="checkbox"
            checked={wholeWord}
            onChange={handleWholeWordToggle}
          />
          <span>Whole word</span>
        </label>
      </div>

      <div className="search-all-tabs-summary">
        {searchAllTabsQuery && (
          <span>
            {searchAllTabsResults.length > 0
              ? `Found ${searchAllTabsResults.length} match${
                  searchAllTabsResults.length === 1 ? '' : 'es'
                } in ${Object.keys(resultsByDocument).length} document${
                  Object.keys(resultsByDocument).length === 1 ? '' : 's'
                }`
              : 'No matches found'}
          </span>
        )}
      </div>

      <div className="search-all-tabs-results">
        {Object.entries(resultsByDocument).map(([docId, docResults]) => {
          const docName = docResults[0].documentName;
          return (
            <div key={docId} className="search-results-document">
              <div className="search-results-document-header">
                {docName} ({docResults.length} match{docResults.length === 1 ? '' : 'es'})
              </div>
              <div className="search-results-list">
                {docResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-result-item"
                    onClick={() => handleResultClick(result)}
                  >
                    <span className="search-result-line-number">
                      Line {result.lineNumber}:
                    </span>
                    <span className="search-result-line-text">
                      {result.lineText.substring(0, result.matchIndex)}
                      <span className="search-result-match">
                        {result.lineText.substring(
                          result.matchIndex,
                          result.matchIndex + result.matchLength
                        )}
                      </span>
                      {result.lineText.substring(result.matchIndex + result.matchLength)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
