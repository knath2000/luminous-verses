'use client';

import React from 'react';
import { SearchModeToggleProps } from '../../types/navigation';
import { MagnifyingGlassIcon, HashtagIcon } from '@heroicons/react/24/outline';

/**
 * Toggle component for switching between verse number and translation search modes
 */
export function SearchModeToggle({ 
  mode, 
  onChange, 
  disabled = false 
}: SearchModeToggleProps) {
  return (
    <div className="flex items-center bg-black/20 backdrop-blur-sm rounded-lg p-1 border border-purple-500/30">
      <button
        onClick={() => onChange('verse')}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${mode === 'verse' 
            ? 'bg-purple-500 text-white shadow-md' 
            : 'text-gray-300 hover:text-white hover:bg-purple-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Search by verse number"
      >
        <HashtagIcon className="h-4 w-4" />
        <span>Verse #</span>
      </button>
      
      <button
        onClick={() => onChange('translation')}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
          ${mode === 'translation' 
            ? 'bg-purple-500 text-white shadow-md' 
            : 'text-gray-300 hover:text-white hover:bg-purple-500/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Search translation text"
      >
        <MagnifyingGlassIcon className="h-4 w-4" />
        <span>Translation</span>
      </button>
    </div>
  );
}

export default SearchModeToggle; 