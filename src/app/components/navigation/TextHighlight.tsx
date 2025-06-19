'use client';

import React from 'react';
import { TextHighlightProps } from '../../types/navigation';

/**
 * Component for displaying text with highlighted search terms
 * Safely renders HTML highlighting from search results
 */
export function TextHighlight({ 
  text, 
  searchTerms, 
  className = '',
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-medium'
}: TextHighlightProps) {
  // If text already contains HTML (from search highlighting), render as HTML
  if (text.includes('<mark')) {
    return (
      <span 
        className={className}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  // If no search terms, render plain text
  if (!searchTerms.length) {
    return <span className={className}>{text}</span>;
  }

  // Client-side highlighting for cases where pre-highlighting wasn't done
  let highlightedText = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedTerms = [...new Set(searchTerms)].sort((a, b) => b.length - a.length);
  
  sortedTerms.forEach((term, index) => {
    if (!term.trim()) return;
    
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a unique placeholder to avoid conflicts
    const placeholder = `__HIGHLIGHT_${index}__`;
    
    // Case-insensitive replacement with word boundaries when possible
    const wordBoundaryRegex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
    const simpleRegex = new RegExp(`(${escapedTerm})`, 'gi');
    
    if (wordBoundaryRegex.test(highlightedText)) {
      highlightedText = highlightedText.replace(wordBoundaryRegex, placeholder);
    } else {
      highlightedText = highlightedText.replace(simpleRegex, placeholder);
    }
  });

  // Replace placeholders with React elements
  const parts = highlightedText.split(/(__HIGHLIGHT_\d+__)/);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^__HIGHLIGHT_\d+__$/)) {
          // Find which term this placeholder represents
          const termIndex = parseInt(part.match(/\d+/)?.[0] || '0');
          const originalTerm = sortedTerms[termIndex];
          
          return (
            <mark 
              key={index} 
              className={highlightClassName}
            >
              {originalTerm}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
}

export default TextHighlight; 