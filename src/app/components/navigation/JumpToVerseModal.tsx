'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VerseSearchInput } from './VerseSearchInput';
import { SearchableVerseGrid } from './SearchableVerseGrid';
import { SearchModeToggle } from './SearchModeToggle';
import { TranslationSearchResults } from './TranslationSearchResults';
import { useTranslationSearch } from '../../hooks/useTranslationSearch';
import type { JumpToVerseProps } from '../../types/navigation';
import { MODAL_FADE_DURATION, VERSE_NAVIGATION_THRESHOLD } from '../../constants/navigation';
import { VersePill } from './VersePill';

/**
 * Enhanced Jump to Verse Modal with gamified glassmorphic design
 */
export function JumpToVerseModal({
  isOpen,
  onClose,
  onVerseSelect,
  totalVerses,
  currentVerse,
  surahName,
  isLoading = false
}: JumpToVerseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'verse' | 'translation'>('verse');
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Extract surah number from context or props (assuming it's available)
  // Note: You might need to pass surahNumber as a prop if not available
  const surahNumber = 1; // TODO: Get this from props or context

  // Translation search hook
  const {
    results: translationResults,
    loading: translationLoading,
    error: translationError,
    totalResults,
    searchTime
  } = useTranslationSearch({
    surahNumber,
    searchQuery: searchMode === 'translation' ? searchQuery : '',
    enabled: isOpen && searchMode === 'translation'
  });

  // Clear search when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchMode('verse');
      setShowKeyboardHelp(false);
    }
  }, [isOpen]);

  // Handle verse selection
  const handleVerseSelect = useCallback((verseNumber: number) => {
    onVerseSelect(verseNumber);
    setTimeout(() => {
      onClose();
    }, MODAL_FADE_DURATION);
  }, [onVerseSelect, onClose]);

  // Handle search mode change
  const handleSearchModeChange = (mode: 'verse' | 'translation') => {
    setSearchMode(mode);
    setSearchQuery(''); // Clear search when switching modes
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'Tab':
          if (e.shiftKey) {
            e.preventDefault();
            setSearchMode(prev => prev === 'verse' ? 'translation' : 'verse');
          }
          break;
        case '?':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            setShowKeyboardHelp(prev => !prev);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const shouldUseGrid = totalVerses > VERSE_NAVIGATION_THRESHOLD;

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      {/* Enhanced Backdrop with ambient effect */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-2xl w-full glass-morphism-dark rounded-3xl shadow-2xl relative overflow-hidden">
          
          {/* Decorative floating gradient orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"></div>
          
          {/* Header with sparkles and emojis */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/20">
            <div className="flex items-center space-x-4">
              {/* Gamified icon container */}
              <div className="relative group">
                <div className="p-3 glass-morphism rounded-2xl bg-gradient-to-r from-gold/20 to-purple-500/20 border border-gold/30">
                  <span className="text-2xl">
                    {searchMode === 'verse' ? '📖' : '🔍'}
                  </span>
                </div>
                {/* Animated glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
              </div>
              
              <div>
                <DialogTitle className="text-2xl font-bold text-gradient-gold flex items-center gap-2">
                  <span>✨</span>
                  {searchMode === 'verse' ? 'Jump to Verse' : 'Search Translation'}
                  <span>✨</span>
                </DialogTitle>
                <p className="text-white/70 text-sm flex items-center gap-1">
                  <span>📚</span>
                  {surahName} • {totalVerses} verses
                  {currentVerse && (
                    <span className="text-gold">
                      • Currently at verse {currentVerse}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Help button with sparkle */}
              <button
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                className="group p-3 glass-morphism rounded-full hover:bg-gold/20 transition-all duration-300 transform hover:scale-110"
                title="Keyboard shortcuts"
              >
                <span className="text-lg font-mono text-gold group-hover:animate-pulse">
                  ✨?
                </span>
              </button>
              
              {/* Close button with enhanced styling */}
              <button
                onClick={onClose}
                className="group p-3 glass-morphism rounded-full hover:bg-red-500/20 transition-all duration-300 transform hover:scale-110"
              >
                <XMarkIcon className="h-6 w-6 text-white group-hover:text-red-300 transition-colors duration-300" />
              </button>
            </div>
          </div>

          {/* Search Mode Toggle Section */}
          <div className="relative z-10 p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SearchModeToggle
                  mode={searchMode}
                  onChange={handleSearchModeChange}
                  disabled={isLoading}
                />
                <span className="text-sm text-white/50">
                  Switch between verse numbers and content search
                </span>
              </div>
              
              {/* Enhanced Search Stats for Translation Mode */}
              {searchMode === 'translation' && searchQuery && (
                <div className="glass-morphism px-3 py-1 rounded-full border border-gold/30">
                  <span className="text-xs text-gold font-medium">
                    {translationLoading ? (
                      <span className="flex items-center gap-1">
                        <span className="animate-spin">🔍</span>
                        Searching...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span>✨</span>
                        {totalResults} results ({searchTime}ms)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced Search Input */}
            <VerseSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onVerseSelect={handleVerseSelect}
              totalVerses={totalVerses}
              searchMode={searchMode}
              onSearchModeChange={handleSearchModeChange}
              showShortcuts={true}
            />
          </div>

          {/* Content Area with enhanced styling */}
          <div className="relative z-10 p-6 max-h-96 overflow-hidden">
            {searchMode === 'verse' ? (
              /* Enhanced Verse Number Grid/List */
              shouldUseGrid ? (
                <SearchableVerseGrid
                  totalVerses={totalVerses}
                  onVerseSelect={handleVerseSelect}
                  searchQuery={searchQuery}
                  selectedVerse={currentVerse}
                  virtualized={true}
                />
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 p-2">
                  {Array.from({ length: totalVerses }, (_, i) => i + 1).map((verseNumber) => (
                    <VersePill
                      key={verseNumber}
                      number={verseNumber}
                      selected={verseNumber === currentVerse}
                      onClick={() => handleVerseSelect(verseNumber)}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Enhanced Translation Search Results */
              <>
                {translationError && (
                  <div className="p-4 glass-morphism bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 mb-4 flex items-center gap-2">
                    <span>❌</span>
                    <span>Error: {translationError}</span>
                  </div>
                )}
                
                <TranslationSearchResults
                  results={translationResults}
                  onResultSelect={handleVerseSelect}
                  maxResults={8}
                  showLoadMore={false}
                />
                
                {!searchQuery.trim() && (
                  <div className="text-center py-12">
                    <div className="glass-morphism rounded-3xl p-8 border border-white/20">
                      <span className="text-6xl mb-4 block animate-float">🔍</span>
                      <h3 className="text-xl font-bold text-gradient-gold mb-2 flex items-center justify-center gap-2">
                        <span>✨</span>
                        Search Through Translations
                        <span>✨</span>
                      </h3>
                      <p className="text-white/70 mb-2">Start typing to search through verse translations</p>
                      <p className="text-sm text-gold flex items-center justify-center gap-1">
                        <span>🎯</span>
                        Search by words, phrases, or concepts
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Keyboard Shortcuts Help */}
          {showKeyboardHelp && (
            <div className="relative z-10 border-t border-white/20 p-6 glass-morphism bg-black/20">
              <h4 className="text-lg font-bold text-gradient-gold mb-4 flex items-center gap-2">
                <span>⌨️</span>
                Keyboard Shortcuts
                <span>✨</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { action: 'Focus search', key: '/', icon: '🎯' },
                  { action: 'Switch mode', key: 'Shift + Tab', icon: '🔄' },
                  { action: 'Navigate results', key: '↑ ↓', icon: '🧭' },
                  { action: 'Close modal', key: 'Esc', icon: '🚪' }
                ].map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass-morphism rounded-xl border border-white/10">
                    <span className="text-white/90 flex items-center gap-2">
                      <span>{shortcut.icon}</span>
                      {shortcut.action}
                    </span>
                    <kbd className="px-2 py-1 glass-morphism rounded text-xs text-gold font-mono border border-gold/30">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Loading State */}
          {isLoading && (
            <div className="absolute inset-0 glass-morphism-dark backdrop-blur-md flex items-center justify-center rounded-3xl z-50">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/30 border-t-gold mx-auto"></div>
                  <div className="absolute inset-0 rounded-full bg-gold/20 animate-pulse blur-md"></div>
                </div>
                <p className="text-gradient-gold font-semibold flex items-center gap-2">
                  <span>✨</span>
                  Loading magical verses...
                  <span>✨</span>
                </p>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default JumpToVerseModal; 