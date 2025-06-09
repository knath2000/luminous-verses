'use client';

import { useState } from 'react';
import ExpandableText from './ExpandableText';
import useSurahDescription from '../hooks/useSurahDescription';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'themes' | 'context'>('overview');

  const renderThemeIcon = (theme: string) => {
    const iconMap: Record<string, string> = {
      'Praise of Allah': '🌟',
      'Seeking Guidance': '🧭',
      'The Straight Path': '✨',
      'Divine Mercy': '💫',
      'Community Laws': '⚖️',
      'Stories of Prophets': '📖',
      'Faith and Belief': '🕊️',
      'Social Justice': '🤝',
      'Unity of Allah': '☪️',
      'Divine Attributes': '👑',
      'Pure Monotheism': '🔮',
      'Divine Guidance': '🌙',
      'Spiritual Wisdom': '💎',
      'Moral Teachings': '🌸'
    };
    return iconMap[theme] || '⭐';
  };

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
          {/* Tab Navigation */}
          <div className="flex space-x-1 p-4 pb-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📖' },
              { id: 'themes', label: 'Themes', icon: '🎨' },
              { id: 'context', label: 'Context', icon: '🏛️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'themes' | 'context')}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium
                  transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-gold/20 to-purple-500/20 text-gold border border-gold/30'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                    <span>📜</span>
                    About This Chapter
                  </h5>
                  <ExpandableText 
                    text={description.description}
                    maxLength={200}
                    className="text-white/90 text-xs"
                  />
                </div>

                {description.keyVerses.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                      <span>⭐</span>
                      Key Verses
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {description.keyVerses.map((verse) => (
                        <span
                          key={verse}
                          className="px-2 py-1 bg-gradient-to-r from-gold/20 to-purple-500/20 rounded-full text-xs text-gold border border-gold/30"
                        >
                          {verse}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'themes' && (
              <div>
                <h5 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                  <span>🎨</span>
                  Main Themes
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {description.themes.map((theme, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10"
                    >
                      <span className="text-lg">{renderThemeIcon(theme)}</span>
                      <span className="text-white/90 text-xs font-medium">{theme}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'context' && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                    <span>📅</span>
                    Revelation Period
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gold font-medium text-xs">Period:</span>
                      <span className="text-white/90 text-xs">{description.revelation.period}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gold font-medium text-xs">Circumstances:</span>
                      <p className="text-white/90 text-xs leading-relaxed">
                        {description.revelation.circumstances}
                      </p>
                    </div>
                  </div>
                </div>

                {description.historicalContext && (
                  <div>
                    <h5 className="text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                      <span>🏛️</span>
                      Historical Context
                    </h5>
                    <ExpandableText 
                      text={description.historicalContext}
                      maxLength={150}
                      className="text-white/90 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurahDescriptionHeader;