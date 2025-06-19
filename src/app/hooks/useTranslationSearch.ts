'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchVersesBatch } from '../utils/quranApi';
import type { 
  UseTranslationSearchProps, 
  UseTranslationSearchReturn, 
  TranslationSearchResult 
} from '../types/navigation';

/**
 * Custom hook for searching English translations within a surah
 * Implements client-side text search with relevance ranking
 */
export const useTranslationSearch = ({
  surahNumber,
  searchQuery,
  enabled = true
}: UseTranslationSearchProps): UseTranslationSearchReturn => {
  const [allVerses, setAllVerses] = useState<Array<{
    id: number;
    surahId: number;
    numberInSurah: number;
    text: string;
    translation?: string;
    transliteration?: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedSurah, setFetchedSurah] = useState<number | null>(null);

  // Fetch all verses for the surah with translations
  const fetchSurahVerses = useCallback(async (surah: number) => {
    if (!enabled || surah === fetchedSurah) return;

    setLoading(true);
    setError(null);

    try {
      // Start with a reasonable batch size and expand if needed
      let startVerse = 1;
      let allFetchedVerses: Array<{
        id: number;
        surahId: number;
        numberInSurah: number;
        text: string;
        translation?: string;
        transliteration?: string;
      }> = [];
      let hasMore = true;

      while (hasMore) {
        const endVerse = startVerse + 49; // Fetch 50 verses at a time
        
        const result = await fetchVersesBatch(
          surah,
          startVerse,
          endVerse,
          true, // includeTranslations
          false // includeTransliterations (not needed for text search)
        );

        allFetchedVerses = [...allFetchedVerses, ...result.verses];
        hasMore = result.pagination.hasMore;
        startVerse = endVerse + 1;

        // Safety check to prevent infinite loop
        if (startVerse > 300) break; // Max verses in any surah is 286 (Al-Baqarah)
      }

      setAllVerses(allFetchedVerses);
      setFetchedSurah(surah);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verses');
      setAllVerses([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchedSurah]);

  // Fetch verses when surah changes
  useEffect(() => {
    if (surahNumber && enabled) {
      fetchSurahVerses(surahNumber);
    }
  }, [surahNumber, enabled, fetchSurahVerses]);

  // Text search and ranking logic
  const searchResults = useMemo(() => {
    const startTime = performance.now();
    
    if (!searchQuery.trim() || !allVerses.length) {
      return {
        results: [],
        totalResults: 0,
        searchTime: 0
      };
    }

    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    const results: TranslationSearchResult[] = [];

    for (const verse of allVerses) {
      if (!verse.translation) continue;

      const translation = verse.translation.toLowerCase();
      
      let relevanceScore = 0;
      let matchType: 'exact_phrase' | 'all_words' | 'partial_words' = 'partial_words';
      const matchedWords: string[] = [];
      
      // 1. Exact phrase match (highest score)
      if (translation.includes(query)) {
        relevanceScore = 100;
        matchType = 'exact_phrase';
        matchedWords.push(query);
      }
      // 2. All words present (high score)
      else if (queryWords.every(word => translation.includes(word))) {
        relevanceScore = 80;
        matchType = 'all_words';
        matchedWords.push(...queryWords.filter(word => translation.includes(word)));
      }
      // 3. Some words present (medium score)
      else {
        const foundWords = queryWords.filter(word => translation.includes(word));
        if (foundWords.length > 0) {
          relevanceScore = (foundWords.length / queryWords.length) * 60;
          matchType = 'partial_words';
          matchedWords.push(...foundWords);
        }
      }

      // Only include results with matches
      if (relevanceScore > 0) {
        // Bonus scoring for word boundary matches
        queryWords.forEach(word => {
          const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
          if (wordRegex.test(translation)) {
            relevanceScore += 5; // Small bonus for word boundary matches
          }
        });

        // Create highlighted translation
        const highlightedTranslation = highlightSearchTerms(
          verse.translation, 
          matchedWords
        );

        results.push({
          verse: {
            id: verse.id,
            surahId: verse.surahId,
            numberInSurah: verse.numberInSurah,
            text: verse.text,
            translation: verse.translation,
            transliteration: verse.transliteration
          },
          relevanceScore,
          matchType,
          matchedWords,
          highlightedTranslation
        });
      }
    }

    // Sort by relevance score (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const endTime = performance.now();
    const searchTime = Math.round(endTime - startTime);

    return {
      results,
      totalResults: results.length,
      searchTime
    };
  }, [searchQuery, allVerses]);

  return {
    results: searchResults.results,
    loading,
    error,
    totalResults: searchResults.totalResults,
    searchTime: searchResults.searchTime
  };
};

/**
 * Highlight search terms in text
 * Returns HTML string with highlighted terms wrapped in <mark> tags
 */
function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length) return text;

  let highlightedText = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedTerms = [...searchTerms].sort((a, b) => b.length - a.length);
  
  sortedTerms.forEach(term => {
    // Case-insensitive replacement with word boundaries when possible
    const regex = new RegExp(`(\\b${escapeRegExp(term)}\\b)`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    
    // If no word boundary match, try simple case-insensitive match
    if (!regex.test(highlightedText)) {
      const simpleRegex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
      highlightedText = highlightedText.replace(simpleRegex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    }
  });

  return highlightedText;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default useTranslationSearch; 