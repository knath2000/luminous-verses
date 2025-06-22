"use client";

import React, { useMemo } from "react";
import { useAudioControls } from "../contexts/AudioContext";

/**
 * Global mini audio bar – parity with the native overlay.
 * Appears at the bottom-center whenever a verse is loaded in the AudioContext.
 */
export default function MiniAudioBar() {
  const { isPlaying, currentVerse, stop, play } = useAudioControls();

  const label = useMemo(() => {
    if (!currentVerse) return "";
    return `S${currentVerse.surah} • Ayah ${currentVerse.verse}`;
  }, [currentVerse]);

  if (!currentVerse) return null;

  const handleStop = () => {
    stop();
  };

  const handleSkip = () => {
    if (currentVerse) {
      play(currentVerse.surah, currentVerse.verse + 1).catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 select-none">
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md bg-black/60 border border-white/10 text-white/90">
        {/* Stop */}
        <button
          className="w-8 h-8 flex items-center justify-center hover:text-amber-400 transition-colors"
          onClick={handleStop}
          aria-label="Stop playback"
        >
          {/* Square icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Skip */}
        <button
          className="w-8 h-8 flex items-center justify-center hover:text-amber-400 transition-colors"
          onClick={handleSkip}
          aria-label="Skip to next verse"
        >
          {/* Skip-forward icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M5 4l10 8-10 8V4zm12 0h2v16h-2z" />
          </svg>
        </button>

        <span className="font-semibold tracking-wide text-sm whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
} 