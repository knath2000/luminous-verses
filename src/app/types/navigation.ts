/**
 * TypeScript interfaces for navigation features
 */

export interface VerseReference {
  surahNumber: number;
  verseNumber: number;
  transliteration?: string;
  translation?: string;
}

export interface JumpToVerseProps {
  isOpen: boolean;
  onClose: () => void;
  onVerseSelect: (verseNumber: number) => void;
  totalVerses: number;
  currentVerse?: number;
  surahName?: string;
  isLoading?: boolean;
  searchMode?: 'verse' | 'translation';
  onSearchModeChange?: (mode: 'verse' | 'translation') => void;
}

export interface VerseNavigatorProps {
  surahNumber: number;
  totalVerses: number;
  currentVerse?: number;
  onNavigate: (verseNumber: number) => void;
  showSearch?: boolean;
  showKeyboardShortcuts?: boolean;
  virtualized?: boolean;
}

export interface SearchableVerseGridProps {
  totalVerses: number;
  onVerseSelect: (verseNumber: number) => void;
  searchQuery?: string;
  selectedVerse?: number;
  virtualized?: boolean;
  itemHeight?: number;
  overscanCount?: number;
  searchMode?: 'verse' | 'translation';
}

export interface VerseSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onVerseSelect: (verseNumber: number) => void;
  totalVerses: number;
  placeholder?: string;
  showShortcuts?: boolean;
  searchMode?: 'verse' | 'translation';
  onSearchModeChange?: (mode: 'verse' | 'translation') => void;
}

// New interfaces for translation search
export interface TranslationSearchResult {
  verse: {
    id: number;
    surahId: number;
    numberInSurah: number;
    text: string; // Arabic text
    translation: string; // English translation
    transliteration?: string;
  };
  relevanceScore: number;
  matchType: 'exact_phrase' | 'all_words' | 'partial_words';
  matchedWords: string[];
  highlightedTranslation: string;
}

export interface UseTranslationSearchProps {
  surahNumber: number;
  searchQuery: string;
  enabled?: boolean;
}

export interface UseTranslationSearchReturn {
  results: TranslationSearchResult[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  searchTime: number;
}

export interface TextHighlightProps {
  text: string;
  searchTerms: string[];
  className?: string;
  highlightClassName?: string;
}

export interface SearchModeToggleProps {
  mode: 'verse' | 'translation';
  onChange: (mode: 'verse' | 'translation') => void;
  disabled?: boolean;
}

export interface TranslationSearchResultsProps {
  results: TranslationSearchResult[];
  onResultSelect: (verseNumber: number) => void;
  maxResults?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
}

export interface ScrollToVerseOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth' | 'instant';
  delay?: number;
}

export interface NavigationHistory {
  surahNumber: number;
  verseNumber: number;
  timestamp: number;
  source: 'jump' | 'scroll' | 'search' | 'bookmark' | 'translation_search';
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  disabled?: boolean;
}

export interface VirtualizedGridProps {
  height: number;
  width: number;
  itemCount: number;
  itemHeight: number;
  overscanCount?: number;
  onItemRender: (index: number) => React.ReactNode;
}

export type NavigationSource = 'modal' | 'search' | 'bookmark' | 'history' | 'keyboard' | 'translation_search';

export interface NavigationEvent {
  type: 'verse_jump' | 'verse_scroll' | 'search_query' | 'translation_search';
  source: NavigationSource;
  fromVerse?: number;
  toVerse: number;
  surahNumber: number;
  timestamp: number;
  searchQuery?: string;
  resultCount?: number;
} 