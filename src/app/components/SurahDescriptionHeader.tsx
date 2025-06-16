'use client';

import useSurahDescription from '../hooks/useSurahDescription';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface SurahMetadata {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface SurahDescriptionHeaderProps {
  surah: SurahMetadata;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SurahDescriptionHeader({
  surah,
  isExpanded,
  onToggle,
}: SurahDescriptionHeaderProps) {
  const { data: description, loading, error } = useSurahDescription(surah.number);

  // Portal root for overlay
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (isExpanded) {
      setPortalRoot(document.body);
    } else {
      setPortalRoot(null);
    }
  }, [isExpanded]);

  if (loading) {
    return (
      <div className="glass-morphism rounded-xl p-4 mb-6 border border-white/10">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white/70 text-sm">Loading surah details...</span>
          </div>
          <svg 
            className={`w-5 h-5 text-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  if (error || !description) {
    return (
      <div className="glass-morphism rounded-xl p-4 mb-6 border border-white/10">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-white/70 text-sm">
              {error || 'Unable to load surah details'}
            </span>
          </div>
          <svg 
            className={`w-5 h-5 text-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-morphism rounded-xl mb-6 border border-white/10 overflow-hidden relative">
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors duration-200"
        aria-expanded={isExpanded}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-gold text-sm font-medium">📖 Surah Details</span>
            <span className="text-white/50 text-xs">
              Learn about the themes, context, and key messages
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </span>
          <svg 
            className={`w-5 h-5 text-gold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && portalRoot
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex items-start justify-center pt-24 px-4 sm:px-0"
              style={{ pointerEvents: 'auto' }}
              role="dialog"
              aria-modal="true"
              aria-label="Surah Description"
            >
              {/* Backdrop */}
              <div className="fixed inset-0 bg-desert-night/80 backdrop-blur-sm z-0" aria-hidden="true"></div>
              {/* Overlay Panel */}
              <div className="relative z-10 w-full max-w-2xl mx-auto glass-morphism bg-desert-night/95 rounded-xl shadow-2xl border border-gold-900/30 p-6 flex flex-col">
                {/* Sticky Header */}
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-desert-night/95 rounded-t-xl z-20 p-2">
                  <div>
                    <h3 className="text-xl font-bold text-gold font-amiri mb-1">{surah.englishName}</h3>
                    <div className="text-gold/80 text-xs font-medium">{surah.revelationType}</div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="ml-4 px-3 py-1 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    aria-label="Close Surah Description"
                  >
                    ✕
                  </button>
                </div>
                {/* Description Content */}
                <div className="prose prose-invert text-gold-100/90 text-base max-h-[60vh] overflow-y-auto">
                  {description && typeof description === 'object' && 'description' in description
                    ? description.description
                    : typeof description === 'string'
                    ? description
                    : 'No description available.'}
                </div>
              </div>
            </div>,
            portalRoot
          )
        : (
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden relative z-30 bg-desert-night/95 rounded-b-xl shadow-xl`}
              aria-hidden={!isExpanded}
            >
              <div className="border-t border-gold-900/30 px-6 py-4 prose prose-invert text-gold-100/90 text-base">
                {description && typeof description === 'object' && 'description' in description
                  ? description.description
                  : typeof description === 'string'
                  ? description
                  : 'No description available.'}
              </div>
            </div>
          )}
    </div>
  );
}

export default SurahDescriptionHeader;