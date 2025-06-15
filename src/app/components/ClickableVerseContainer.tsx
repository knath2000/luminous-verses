'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useVerseAudio } from '../hooks/useAudio';
import { useUserGesture } from '../contexts/UserGestureContext';
import { getVerseElementId } from '../utils/scrollUtils';
import { useUser } from '@stackframe/stack'; // Import useUser
import AuthModal from './AuthModal'; // Corrected import for AuthModal

interface ClickableVerseContainerProps {
  surah: number;
  verse: number;
  children: React.ReactNode;
  className?: string;
  onVerseClick?: (surah: number, verse: number) => void;
  disabled?: boolean;
  // New props for bookmarking
  verseText: string;
  surahName: string;
  translation: string;
}

const LONG_PRESS_DURATION = 500; // milliseconds

export function ClickableVerseContainer({
  surah,
  verse,
  children,
  className = '',
  onVerseClick,
  disabled = false,
  verseText,
  surahName,
  translation,
}: ClickableVerseContainerProps) {
  const { playVerse, isPlaying, isCurrentVerse } = useVerseAudio(surah, verse);
  const { recordInteraction, isAudioReady } = useUserGesture();
  const user = useUser(); // Get user from Stack Auth
  const [showAuthModal, setShowAuthModal] = useState(false);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handleBookmark = useCallback(async () => {
    if (!user || !user.id) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          surahid: surah,
          versenumber: verse,
          versetext: verseText,
          surahname: surahName,
          translation: translation,
        }),
      });

      if (response.ok) {
        console.log('Verse bookmarked successfully!');
        // Optionally show a toast notification
      } else {
        console.error('Failed to bookmark verse:', response.status, response.statusText);
        // Optionally show an error notification
      }
    } catch (error) {
      console.error('Error bookmarking verse:', error);
      // Optionally show an aerror notification
    }
  }, [user, surah, verse, verseText, surahName, translation]);

  const handlePressStart = useCallback(() => {
    setIsLongPressing(false); // Reset on new press
    pressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      // Trigger bookmark action here
      handleBookmark();
    }, LONG_PRESS_DURATION);
  }, [handleBookmark]); // Added handleBookmark to dependency array

  const handlePressEnd = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const handleClick = useCallback(async (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) return;
    if (isLongPressing) { // Prevent click if it was a long press
      event.preventDefault();
      return;
    }

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
  }, [disabled, isLongPressing, recordInteraction, onVerseClick, surah, verse, playVerse]);

  return (
    <>
      <div
        id={getVerseElementId(surah, verse)}
        className={`
          relative cursor-pointer
          transition-all duration-200
          ${isCurrentVerse && isPlaying ? 'ring-2 ring-amber-400/50' : ''}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${className}
        `}
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
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

        {/* Audio Status Indicator */}
        {isCurrentVerse && isPlaying && (
          <div className="absolute top-1 left-1 z-10">
            <div className="flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Playing
            </div>
          </div>
        )}
      </div>
      {showAuthModal && (
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}