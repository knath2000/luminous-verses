'use client';

import useSurahDescription from '../hooks/useSurahDescription';
import SurahDetails from './SurahDetails'; // Import the new SurahDetails component

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

const SurahDescriptionHeader = ({ surah, isExpanded, onToggle }: SurahDescriptionHeaderProps) => {
  const { data: description, loading, error } = useSurahDescription(surah.number);

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
    <div className="glass-morphism rounded-xl mb-6 border border-white/10 overflow-hidden">
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
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="border-t border-white/10">
          <SurahDetails description={description} isHeader={true} />
        </div>
      </div>
    </div>
  );
};

export default SurahDescriptionHeader;