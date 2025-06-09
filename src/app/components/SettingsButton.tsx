'use client';

import { useCallback } from 'react';

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
}

export default function SettingsButton({ onClick, className = '' }: SettingsButtonProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    }
  }, [handleClick]);

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative glass-morphism px-6 py-4 rounded-2xl 
        hover:animate-glow transition-all duration-300 transform hover:scale-105 
        focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50
        ${className}
      `}
      aria-label="Open settings to configure app preferences"
      tabIndex={0}
    >
      <div className="flex items-center justify-center gap-3">
        {/* Settings Gear Icon */}
        <div className="relative">
          <svg 
            className="w-6 h-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300 group-hover:rotate-90 transform transition-transform duration-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" 
              clipRule="evenodd" 
            />
          </svg>
          
          {/* Animated glow effect */}
          <div className="absolute inset-0 w-6 h-6 bg-purple-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <span className="text-lg font-bold text-gradient-purple">
          Settings
        </span>
        
        {/* Sparkle icon */}
        <span className="text-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" role="img" aria-label="sparkles">
          ⚙️
        </span>
      </div>
      
      <p className="text-white/70 text-sm mt-1">
        Configure your preferences
      </p>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </button>
  );
}