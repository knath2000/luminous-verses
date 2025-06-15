'use client';

import React, { useCallback } from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleSwitch({ id, label, description, checked, onChange, disabled = false }: ToggleSwitchProps) {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, onChange, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  return (
    <div className="flex items-center justify-between p-4 glass-morphism rounded-xl border border-white/10 hover:border-purple-400/40 transition-all duration-300">
      <div className="flex-1">
        <label htmlFor={id} className="text-white font-semibold text-lg cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-white/70 text-sm mt-1">{description}</p>
        )}
      </div>
      
      <div className="ml-4">
        <button
          id={id}
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent
            ${checked 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30' 
              : 'bg-gray-600/50 hover:bg-gray-500/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
              ${checked ? 'translate-x-7' : 'translate-x-1'}
            `}
          >
            {/* Inner indicator */}
            <div className={`
              absolute inset-0 rounded-full transition-all duration-300
              ${checked 
                ? 'bg-gradient-to-br from-purple-400 to-blue-400 opacity-20' 
                : 'bg-gray-400 opacity-10'
              }
            `} />
          </span>
          
          {/* Toggle state indicators */}
          <div className={`
            absolute left-2 top-1/2 transform -translate-y-1/2 transition-opacity duration-300
            ${checked ? 'opacity-0' : 'opacity-100'}
          `}>
            <svg className="w-3 h-3 text-white/60" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className={`
            absolute right-2 top-1/2 transform -translate-y-1/2 transition-opacity duration-300
            ${checked ? 'opacity-100' : 'opacity-0'}
          `}>
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}