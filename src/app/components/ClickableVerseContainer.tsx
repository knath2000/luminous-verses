'use client';

import React, { useState, useCallback } from 'react';
import { SimplePlayButton } from './AudioControls';
import { useVerseAudio } from '../hooks/useAudio';
import { useUserGesture } from '../contexts/UserGestureContext';
import { getVerseElementId } from '../utils/scrollUtils';

interface ClickableVerseContainerProps {
  surah: number;
  verse: number;
  children: React.ReactNode;
  className?: string;
  showPlayButton?: boolean;
  playButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  onVerseClick?: (surah: number, verse: number) => void;
  disabled?: boolean;
}

export function ClickableVerseContainer({
  surah,
  verse,
  children,
  className = '',
  showPlayButton = true,
  playButtonPosition = 'top-right',
  onVerseClick,
  disabled = false
}: ClickableVerseContainerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { playVerse, isPlaying, isCurrentVerse } = useVerseAudio(surah, verse);
  const { recordInteraction, isAudioReady } = useUserGesture();

  const handleClick = useCallback(async (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) return;

    // Record user interaction for audio unlock
    recordInteraction();

    // Call custom click handler if provided
    if (onVerseClick) {
      onVerseClick(surah, verse);
    } else {
      // Default behavior: play audio
      event.preventDefault();
      await playVerse();
    }
  }, [disabled, recordInteraction, onVerseClick, surah, verse, playVerse]);

  const handlePlayButtonClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering container click
    recordInteraction();
    playVerse();
  }, [recordInteraction, playVerse]);

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div
      id={getVerseElementId(surah, verse)}
      className={`
        relative group cursor-pointer
        transition-all duration-200
        ${isCurrentVerse && isPlaying ? 'ring-2 ring-amber-400/50' : ''}
        ${isHovered ? 'transform scale-[1.02]' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Verse ${surah}:${verse}${isAudioReady ? ' - Click to play audio' : ''}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick(event);
        }
      }}
    >
      {children}

      {/* Play Button Overlay */}
      {showPlayButton && (
        <div
          className={`
            absolute ${positionClasses[playButtonPosition]}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            z-10
          `}
        >
          <div onClick={handlePlayButtonClick}>
            <SimplePlayButton 
              surah={surah} 
              verse={verse} 
              size="sm"
              className="shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Audio Status Indicator */}
      {isCurrentVerse && isPlaying && (
        <div className="absolute top-1 left-1 z-10">
          <div className="flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Playing
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-amber-500/10 rounded-lg pointer-events-none" />
      )}

      {/* Audio Readiness Hint */}
      {!isAudioReady && isHovered && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded text-center backdrop-blur-sm">
            Click to enable audio
          </div>
        </div>
      )}
    </div>
  );
}

interface VerseWithAudioProps {
  surah: number;
  verse: number;
  arabicText: string;
  transliteration?: string;
  translation?: string;
  className?: string;
}

export function VerseWithAudio({
  surah,
  verse,
  arabicText,
  transliteration,
  translation,
  className = ''
}: VerseWithAudioProps) {
  return (
    <ClickableVerseContainer
      surah={surah}
      verse={verse}
      className={`p-4 rounded-lg border border-gray-700 hover:border-amber-400/50 ${className}`}
      showPlayButton={true}
      playButtonPosition="top-right"
    >
      <div className="space-y-3">
        {/* Verse Number */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400 font-mono">
            {surah}:{verse}
          </div>
        </div>

        {/* Arabic Text */}
        <div className="text-right text-xl leading-relaxed font-arabic text-white">
          {arabicText}
        </div>

        {/* Transliteration */}
        {transliteration && (
          <div className="text-gray-300 italic text-sm leading-relaxed">
            {transliteration}
          </div>
        )}

        {/* Translation */}
        {translation && (
          <div className="text-gray-200 text-sm leading-relaxed border-t border-gray-700 pt-3">
            {translation}
          </div>
        )}
      </div>
    </ClickableVerseContainer>
  );
}

interface AudioVerseListProps {
  verses: Array<{
    surah: number;
    verse: number;
    arabicText: string;
    transliteration?: string;
    translation?: string;
  }>;
  className?: string;
}

export function AudioVerseList({ verses, className = '' }: AudioVerseListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {verses.map((verseData) => (
        <VerseWithAudio
          key={`${verseData.surah}:${verseData.verse}`}
          {...verseData}
        />
      ))}
    </div>
  );
}

interface QuickPlayButtonProps {
  surah: number;
  verse: number;
  label?: string;
  className?: string;
}

export function QuickPlayButton({ 
  surah, 
  verse, 
  label = `Play ${surah}:${verse}`,
  className = '' 
}: QuickPlayButtonProps) {
  const { playVerse, isPlaying, isLoading } = useVerseAudio(surah, verse);
  const { recordInteraction } = useUserGesture();

  const handleClick = useCallback(() => {
    recordInteraction();
    playVerse();
  }, [recordInteraction, playVerse]);

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-3 py-2
        bg-gradient-to-r from-amber-400/20 to-amber-500/20
        hover:from-amber-400/30 hover:to-amber-500/30
        border border-amber-400/30 hover:border-amber-400/50
        text-amber-200 hover:text-amber-100
        rounded-lg text-sm font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={label}
    >
      {isLoading ? (
        <div className="animate-spin w-4 h-4">
          <svg fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : isPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      )}
      {label}
    </button>
  );
}