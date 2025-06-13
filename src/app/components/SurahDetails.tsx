'use client';

import { useState } from 'react';
import ExpandableText from './ExpandableText';
import { SurahDescriptionData } from '../hooks/useSurahDescription';

interface SurahDetailsProps {
  description: SurahDescriptionData;
  onBack?: () => void; // Optional for header version
  onContinueReading?: () => void; // Optional for full page version
  isHeader?: boolean; // Flag to indicate if it's used as a header
}

const SurahDetails = ({ description, onBack, onContinueReading, isHeader = false }: SurahDetailsProps) => {
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

  const textMaxLength = isHeader ? 150 : 300;
  const textSizeClass = isHeader ? 'text-xs' : '';
  const gapClass = isHeader ? 'gap-2' : 'gap-3';
  const paddingClass = isHeader ? 'p-4 pb-2' : 'p-6';
  const tabTextSizeClass = isHeader ? 'text-xs' : 'text-sm';

  return (
    <>
      {!isHeader && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-gold transition-colors duration-200"
            aria-label="Go back to surah list"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Back to List</span>
          </button>

          <div className="text-right">
            <div className="text-xs text-white/50 uppercase tracking-wider">
              {description.type} • {description.ayas} Verses
            </div>
          </div>
        </div>
      )}

      {!isHeader && (
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-amiri">
            {description.name}
          </h1>
          <h2 className="text-xl text-gold mb-1">
            {description.ename}
          </h2>
          <p className="text-white/70 text-sm">
            {description.tname}
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className={`flex space-x-1 mb-6 glass-morphism rounded-lg ${paddingClass}`}>
        {[
          { id: 'overview', label: 'Overview', icon: '📖' },
          { id: 'themes', label: 'Themes', icon: '🎨' },
          { id: 'context', label: 'Context', icon: '🏛️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'themes' | 'context')}
            className={`
              flex-1 flex items-center justify-center ${gapClass} py-2 px-3 rounded-md ${tabTextSizeClass} font-medium
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
      <div className={`flex-1 overflow-y-auto space-y-6 ${isHeader ? 'max-h-64' : ''}`}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass-morphism rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
                <span>📜</span>
                About This Chapter
              </h3>
              <ExpandableText 
                text={description.description}
                maxLength={textMaxLength}
                className={`text-white/90 ${textSizeClass}`}
              />
            </div>

            {description.keyVerses.length > 0 && (
              <div className="glass-morphism rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
                  <span>⭐</span>
                  Key Verses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {description.keyVerses.map((verse) => (
                    <span
                      key={verse}
                      className="px-3 py-1 bg-gradient-to-r from-gold/20 to-purple-500/20 rounded-full text-sm text-gold border border-gold/30"
                    >
                      Verse {verse}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="space-y-4">
            <div className="glass-morphism rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
                <span>🎨</span>
                Main Themes
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {description.themes.map((theme, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-gold/30 transition-colors duration-200"
                  >
                    <span className="text-2xl">{renderThemeIcon(theme)}</span>
                    <span className={`text-white/90 ${textSizeClass} font-medium`}>{theme}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            <div className="glass-morphism rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
                <span>📅</span>
                Revelation Period
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-gold font-medium ${textSizeClass}`}>Period:</span>
                  <span className={`text-white/90 ${textSizeClass}`}>{description.revelation.period}</span>
                </div>
                <div className="space-y-2">
                  <span className={`text-gold font-medium ${textSizeClass}`}>Circumstances:</span>
                  <p className={`text-white/90 ${textSizeClass} leading-relaxed`}>
                    {description.revelation.circumstances}
                  </p>
                </div>
              </div>
            </div>

            {description.historicalContext && (
              <div className="glass-morphism rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gold mb-4 flex items-center gap-2">
                  <span>🏛️</span>
                  Historical Context
                </h3>
                <ExpandableText 
                  text={description.historicalContext}
                  maxLength={textMaxLength}
                  className={`text-white/90 ${textSizeClass}`}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!isHeader && onContinueReading && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={onContinueReading}
            className="
              w-full py-4 px-6 
              bg-gradient-to-r from-gold/20 to-purple-500/20 
              hover:from-gold/30 hover:to-purple-500/30
              border border-gold/30 hover:border-gold/50
              rounded-xl text-gold font-semibold
              transition-all duration-300 transform hover:scale-[1.02]
              focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-transparent
              flex items-center justify-center gap-3
              group
            "
          >
            <span>Continue Reading</span>
            <svg 
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default SurahDetails;