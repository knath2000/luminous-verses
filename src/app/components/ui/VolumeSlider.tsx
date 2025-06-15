'use client';

import React, { useRef, useCallback } from 'react';
import { useDragInteraction } from '../../hooks/useDragInteraction'; // Import the new hook

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function VolumeSlider({ value, onChange, className = '' }: VolumeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(percentage);
  }, [onChange]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDragging } = useDragInteraction({
    ref: sliderRef,
    onDrag: updateValue,
    onDragStart: () => {}, // No specific action needed on drag start for now
    onDragEnd: () => {}    // No specific action needed on drag end for now
  });

  return (
    <div className={`relative ${className}`}>
      <div
        ref={sliderRef}
        className="relative h-3 bg-gray-600/50 rounded-full cursor-pointer select-none"
        onMouseDown={(e) => {
          // Only trigger drag interaction if the click is on the slider itself
          if (e.target === sliderRef.current) {
            updateValue(e.clientX);
          }
        }}
        onTouchStart={(e) => {
          if (e.target === sliderRef.current) {
            updateValue(e.touches[0].clientX);
          }
        }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label="Volume control"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(0, value - 0.05));
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(1, value + 0.05));
          }
        }}
      >
        {/* Progress bar */}
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg shadow-purple-500/30 transition-all duration-200 relative"
          style={{ width: `${value * 100}%` }}
        >
          {/* Subtle glow effect at the end */}
          <div className="absolute right-0 top-1/2 w-1 h-1 bg-white rounded-full transform -translate-y-1/2 opacity-80" />
        </div>
        
        {/* Focus ring */}
        <div className="absolute inset-0 rounded-full ring-2 ring-purple-400 ring-opacity-0 focus-within:ring-opacity-50 transition-all duration-200" />
      </div>
    </div>
  );
}