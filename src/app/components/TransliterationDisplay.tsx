'use client';

import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface TransliterationDisplayProps {
  transliteration?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * TransliterationDisplay Component
 * 
 * Displays Arabic transliterations with child-friendly styling and proper typography.
 * Based on UX research for Islamic apps and children's learning interfaces.
 * 
 * Features:
 * - Respects user settings for transliteration visibility
 * - Child-friendly typography with proper spacing
 * - Visual hierarchy that supports Arabic text priority
 * - Responsive design for varying text lengths
 * - Glass morphism styling consistent with app theme
 */
export default function TransliterationDisplay({
  transliteration,
  className = '',
  size = 'medium',
  showLabel = false
}: TransliterationDisplayProps) {
  const { settings } = useSettings();

  // Don't render if transliterations are disabled in settings
  if (!settings.showTransliteration) {
    return null;
  }

  // Don't render if no transliteration data
  if (!transliteration || transliteration.trim() === '') {
    return null;
  }

  // Size-based styling
  const sizeClasses = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed'
  };

  // Clean up transliteration text (remove any HTML tags if present)
  const cleanTransliteration = transliteration.replace(/<[^>]*>/g, '');

  return (
    <div className={`transliteration-container ${className}`}>
      {showLabel && (
        <div className="text-xs text-white/60 mb-1 font-medium tracking-wide">
          PRONUNCIATION
        </div>
      )}
      
      <div 
        className={`
          transliteration-text
          ${sizeClasses[size]}
          text-purple-200 
          font-medium 
          italic
          tracking-wide
          leading-relaxed
          px-3 
          py-2
          rounded-lg
          bg-white/5
          backdrop-blur-sm
          border border-white/10
          transition-all duration-300
          hover:bg-white/10
          hover:border-white/20
          select-text
        `}
        dir="ltr"
        lang="en"
        role="complementary"
        aria-label="Arabic pronunciation guide"
      >
        {cleanTransliteration}
      </div>
      
      {/* Subtle visual connector to show relationship with Arabic text */}
      <div className="flex justify-center mt-1">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-purple-300/30 to-transparent"></div>
      </div>
    </div>
  );
}

/**
 * Inline Transliteration Component
 * 
 * For compact display within verse containers
 */
export function InlineTransliteration({
  transliteration,
  className = ''
}: {
  transliteration?: string;
  className?: string;
}) {
  const { settings } = useSettings();

  if (!settings.showTransliteration || !transliteration) {
    return null;
  }

  const cleanTransliteration = transliteration.replace(/<[^>]*>/g, '');

  return (
    <span 
      className={`
        inline-transliteration
        text-sm
        text-purple-200/80
        font-medium
        italic
        tracking-wide
        ${className}
      `}
      dir="ltr"
      lang="en"
      role="complementary"
      aria-label="Pronunciation guide"
    >
      {cleanTransliteration}
    </span>
  );
}

/**
 * Formatted Transliteration Component
 * 
 * Displays transliteration with HTML formatting preserved (for emphasis, etc.)
 */
export function FormattedTransliteration({
  transliteration,
  className = '',
  size = 'medium'
}: {
  transliteration?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}) {
  const { settings } = useSettings();

  if (!settings.showTransliteration || !transliteration) {
    return null;
  }

  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div 
      className={`
        formatted-transliteration
        ${sizeClasses[size]}
        text-purple-200
        font-medium
        italic
        tracking-wide
        leading-relaxed
        ${className}
      `}
      dir="ltr"
      lang="en"
      role="complementary"
      aria-label="Formatted pronunciation guide"
      dangerouslySetInnerHTML={{ __html: transliteration }}
    />
  );
}