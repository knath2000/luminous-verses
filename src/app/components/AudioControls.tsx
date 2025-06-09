'use client';

import React, { useCallback } from 'react';
import { useVerseAudio, useAudioProgress, useVolumeControl } from '../hooks/useAudio';

interface AudioControlsProps {
  surah: number;
  verse: number;
  className?: string;
  showProgress?: boolean;
  showVolume?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioControls({ 
  surah, 
  verse, 
  className = '', 
  showProgress = true,
  showVolume = false,
  size = 'md'
}: AudioControlsProps) {
  const { playVerse, isPlaying, isLoading, isCurrentVerse, error } = useVerseAudio(surah, verse);
  const { progress, formattedCurrentTime, formattedDuration } = useAudioProgress();
  const { volume, isMuted, toggleMute, changeVolume, volumePercent } = useVolumeControl();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const buttonSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value) / 100;
    changeVolume(newVolume);
  }, [changeVolume]);

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-400 ${sizeClasses[size]} ${className}`}>
        <div className="text-red-500">⚠️</div>
        <span className="text-xs">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${sizeClasses[size]} ${className}`}>
      {/* Play/Pause Button */}
      <button
        onClick={playVerse}
        disabled={isLoading}
        className={`
          ${buttonSizeClasses[size]}
          flex items-center justify-center
          bg-gradient-to-r from-amber-400 to-amber-500
          hover:from-amber-500 hover:to-amber-600
          disabled:from-gray-400 disabled:to-gray-500
          text-white rounded-full
          transition-all duration-200
          shadow-lg hover:shadow-xl
          disabled:cursor-not-allowed
          group
        `}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <div className="animate-spin">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
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
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Progress Bar */}
      {showProgress && isCurrentVerse && (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
            {formattedCurrentTime}
          </span>
          
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">
            {formattedDuration}
          </span>
        </div>
      )}

      {/* Volume Control */}
      {showVolume && (
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : volume < 0.5 ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="100"
            value={volumePercent}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Volume"
          />
          
          <span className="text-xs text-gray-400 font-mono w-8">
            {volumePercent}%
          </span>
        </div>
      )}

      {/* Verse Info */}
      <div className="text-xs text-gray-400 font-mono">
        {surah}:{verse}
      </div>
    </div>
  );
}

interface SimplePlayButtonProps {
  surah: number;
  verse: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SimplePlayButton({ surah, verse, className = '', size = 'md' }: SimplePlayButtonProps) {
  const { playVerse, isPlaying, isLoading } = useVerseAudio(surah, verse);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={playVerse}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        bg-gradient-to-r from-amber-400/80 to-amber-500/80
        hover:from-amber-400 hover:to-amber-500
        disabled:from-gray-400/50 disabled:to-gray-500/50
        text-white rounded-full
        transition-all duration-200
        shadow-md hover:shadow-lg
        disabled:cursor-not-allowed
        backdrop-blur-sm
        ${className}
      `}
      aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
    >
      {isLoading ? (
        <div className="animate-spin">
          <svg className={iconSizeClasses[size]} fill="none" viewBox="0 0 24 24">
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
        <svg className={iconSizeClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
      ) : (
        <svg className={`${iconSizeClasses[size]} ml-0.5`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      )}
    </button>
  );
}

// CSS for custom slider styling
const sliderStyles = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #f59e0b;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #f59e0b;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);
}