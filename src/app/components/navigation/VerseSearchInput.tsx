'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VerseSearchInputProps } from '../../types/navigation';
import { SCROLL_ANIMATION_DELAY } from '../../constants/navigation';

/**
 * Enhanced search input component supporting both verse number and translation text search
 */
export function VerseSearchInput({
  value,
  onChange,
  onVerseSelect,
  totalVerses,
  placeholder,
  showShortcuts = true,
  searchMode = 'verse',
  onSearchModeChange // eslint-disable-line @typescript-eslint/no-unused-vars
}: VerseSearchInputProps) {
  const [suggestions, setSuggestions] = useState<Array<{ verse: number; label: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [focusKeyShortcut, setFocusKeyShortcut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Generate verse number suggestions for verse mode
  const generateVerseSuggestions = (query: string) => {
    if (searchMode !== 'verse' || !query.trim()) {
      setSuggestions([]);
      return;
    }

    const numericQuery = query.replace(/\D/g, ''); // Extract only digits
    if (!numericQuery) {
      setSuggestions([]);
      return;
    }

    const suggestions: Array<{ verse: number; label: string }> = [];
    const queryNum = parseInt(numericQuery);

    // Exact match
    if (queryNum <= totalVerses) {
      suggestions.push({ verse: queryNum, label: `Verse ${queryNum}` });
    }

    // Partial matches (verses that start with the query)
    for (let i = 1; i <= totalVerses; i++) {
      if (i !== queryNum && i.toString().startsWith(numericQuery) && suggestions.length < 5) {
        suggestions.push({ verse: i, label: `Verse ${i}` });
      }
    }

    setSuggestions(suggestions);
  };

  // Handle search input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (searchMode === 'verse') {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce suggestions generation
      timeoutRef.current = setTimeout(() => {
        generateVerseSuggestions(newValue);
        setShowSuggestions(newValue.trim().length > 0);
        setSelectedSuggestionIndex(-1);
      }, 150);
    } else {
      // For translation mode, suggestions are handled by parent component
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchMode === 'verse' && showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            selectSuggestion(suggestions[selectedSuggestionIndex]);
          } else if (suggestions.length > 0) {
            selectSuggestion(suggestions[0]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    } else if (searchMode === 'translation' && e.key === 'Enter') {
      // For translation mode, Enter triggers search
      e.preventDefault();
    }
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: { verse: number; label: string }) => {
    onVerseSelect(suggestion.verse);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Delay focus and value update to allow for smooth navigation
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, SCROLL_ANIMATION_DELAY);
  };

  // Focus shortcut handling
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setFocusKeyShortcut(true);
          inputRef.current?.focus();
          setTimeout(() => setFocusKeyShortcut(false), 2000);
        }
      }
    };

    if (showShortcuts) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [showShortcuts]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Dynamic placeholder and input attributes based on mode
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    if (searchMode === 'verse') {
      return showShortcuts ? 'Enter verse number (press / to focus)' : 'Enter verse number';
    } else {
      return showShortcuts ? 'Search translation text (press / to focus)' : 'Search translation text';
    }
  };

  const getInputMode = () => {
    return searchMode === 'verse' ? 'numeric' : 'text';
  };

  const getPattern = () => {
    return searchMode === 'verse' ? '[0-9]*' : undefined;
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchMode === 'verse' && value && setShowSuggestions(true)}
          placeholder={getPlaceholder()}
          inputMode={getInputMode()}
          pattern={getPattern()}
          className={`
            w-full px-4 py-3 bg-black/30 backdrop-blur-sm border-2 rounded-lg
            text-white placeholder-gray-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500/50
            ${focusKeyShortcut 
              ? 'border-purple-400 ring-2 ring-purple-500/50' 
              : 'border-purple-500/50 hover:border-purple-400'
            }
          `}
        />
        
        {/* Shortcuts hint */}
        {showShortcuts && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded border border-gray-600">
              {searchMode === 'verse' ? '↑↓ Enter' : '/ to focus'}
            </kbd>
          </div>
        )}
      </div>

      {/* Verse number suggestions dropdown */}
      {searchMode === 'verse' && showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.verse}
              onClick={() => selectSuggestion(suggestion)}
              className={`
                w-full px-4 py-3 text-left hover:bg-purple-500/20 transition-colors
                ${index === selectedSuggestionIndex ? 'bg-purple-500/30' : ''}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              <span className="text-white">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerseSearchInput;

 