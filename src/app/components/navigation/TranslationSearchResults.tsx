'use client';

import React from 'react';
import { TranslationSearchResultsProps } from '../../types/navigation';
import { TextHighlight } from './TextHighlight';
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import { BookOpenIcon } from '@heroicons/react/24/outline';

/**
 * Component for displaying translation search results with verse previews
 */
export function TranslationSearchResults({
  results,
  onResultSelect,
  maxResults = 10,
  showLoadMore = false,
  onLoadMore
}: TranslationSearchResultsProps) {
  const displayedResults = results.slice(0, maxResults);
  const hasMoreResults = results.length > maxResults;

  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <BookOpenIcon className="h-12 w-12 mx-auto mb-2 text-gray-500" />
        <p>No matching verses found</p>
        <p className="text-sm mt-1">Try different search terms or check your spelling</p>
      </div>
    );
  }

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact_phrase':
        return <CheckCircleIcon className="h-4 w-4 text-green-400" />;
      case 'all_words':
        return <StarIcon className="h-4 w-4 text-yellow-400" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-blue-400" />;
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact_phrase':
        return 'Exact phrase';
      case 'all_words':
        return 'All words';
      case 'partial_words':
        return 'Partial match';
      default:
        return 'Match';
    }
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {/* Results header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-sm p-2 border-b border-purple-500/30">
        <p className="text-sm text-gray-300">
          Found {results.length} result{results.length !== 1 ? 's' : ''} 
          {displayedResults.length < results.length && ` (showing ${displayedResults.length})`}
        </p>
      </div>

      {/* Search results */}
      {displayedResults.map((result) => (
        <button
          key={result.verse.id}
          onClick={() => onResultSelect(result.verse.numberInSurah)}
          className="w-full p-3 text-left bg-black/40 backdrop-blur-sm border border-purple-500/20 
                     rounded-lg hover:border-purple-400/50 hover:bg-black/60 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-purple-300 font-medium">
                Verse {result.verse.numberInSurah}
              </span>
              <div className="flex items-center space-x-1">
                {getMatchTypeIcon(result.matchType)}
                <span className="text-xs text-gray-400">
                  {getMatchTypeLabel(result.matchType)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Score: {Math.round(result.relevanceScore)}
            </div>
          </div>
          
          {/* Arabic text preview */}
          <div className="text-right mb-2 text-gray-300 text-sm font-arabic leading-relaxed">
            {result.verse.text.length > 100 
              ? `${result.verse.text.substring(0, 100)}...` 
              : result.verse.text
            }
          </div>

          {/* Translation with highlighting */}
          <div className="text-white text-sm leading-relaxed">
            <TextHighlight
              text={result.highlightedTranslation}
              searchTerms={result.matchedWords}
              className="block"
            />
          </div>

          {/* Matched words indicator */}
          {result.matchedWords.length > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-500/20">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Matched:</span>
                {result.matchedWords.slice(0, 5).map((word, wordIndex) => (
                  <span
                    key={wordIndex}
                    className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded"
                  >
                    {word}
                  </span>
                ))}
                {result.matchedWords.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{result.matchedWords.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </button>
      ))}

      {/* Load more button */}
      {hasMoreResults && showLoadMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full p-3 text-center bg-purple-500/20 hover:bg-purple-500/30 
                     border border-purple-500/40 rounded-lg text-purple-300 transition-colors"
        >
          Show {Math.min(10, results.length - maxResults)} more results
        </button>
      )}
    </div>
  );
}

export default TranslationSearchResults; 