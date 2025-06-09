'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Toggle Switch Component
interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ id, label, description, checked, onChange, disabled = false }: ToggleSwitchProps) {
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

// Custom Volume Slider Component
interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

function VolumeSlider({ value, onChange, className = '' }: VolumeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(percentage);
  }, [onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updateValue(e.clientX);
  }, [updateValue]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateValue(e.clientX);
    }
  }, [isDragging, updateValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    updateValue(e.touches[0].clientX);
  }, [updateValue]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      updateValue(e.touches[0].clientX);
    }
  }, [isDragging, updateValue]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={sliderRef}
        className="relative h-3 bg-gray-600/50 rounded-full cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
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

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { controls } = useAudio();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      previouslyFocusedElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleAutoplayToggle = useCallback((enabled: boolean) => {
    updateSettings({ autoplay: enabled });
  }, [updateSettings]);

  const handleVolumeChange = useCallback((volume: number) => {
    // Update both settings context and audio context
    updateSettings({ volume });
    controls.setVolume(volume);
  }, [updateSettings, controls]);

  const handleReset = useCallback(() => {
    resetSettings();
    // Also reset audio volume to default
    controls.setVolume(0.8);
  }, [resetSettings, controls]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <div 
          className="relative w-full max-w-md max-h-[90vh] glass-morphism-dark rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative z-10 border-b border-white/10">
            <div className="p-6">
              <div className="flex items-center justify-between">
                {/* Centered Title */}
                <div className="flex-1 text-center">
                  <h2 id="settings-modal-title" className="text-2xl md:text-3xl font-bold text-gradient-purple">
                    ⚙️ Settings ⚙️
                  </h2>
                  <p className="text-white/70 mt-1">Configure your preferences</p>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="group p-2 rounded-full glass-morphism hover:bg-red-500/20 transition-all duration-300"
                  aria-label="Close settings modal"
                >
                  <svg className="w-6 h-6 text-white group-hover:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Audio Settings Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="audio">🎵</span>
                  Audio Settings
                </h3>
                
                <div className="space-y-4">
                  {/* Autoplay Toggle */}
                  <ToggleSwitch
                    id="autoplay-toggle"
                    label="Autoplay Verses"
                    description="Automatically play the next verse when current verse ends"
                    checked={settings.autoplay}
                    onChange={handleAutoplayToggle}
                  />
                  
                  {/* Auto-scroll Toggle */}
                  <ToggleSwitch
                    id="autoscroll-toggle"
                    label="Auto-scroll during Playback"
                    description="Automatically scroll to follow the audio playback for hands-free reading"
                    checked={settings.autoScroll}
                    onChange={(checked) => updateSettings({ autoScroll: checked })}
                  />
                  
                  {/* Future Settings - Disabled for now */}
                  <ToggleSwitch
                    id="show-translation-toggle"
                    label="Show Translation"
                    description="Display English translation below Arabic text"
                    checked={settings.showTranslation}
                    onChange={(checked) => updateSettings({ showTranslation: checked })}
                  />
                  
                  <ToggleSwitch
                    id="show-transliteration-toggle"
                    label="Show Transliteration"
                    description="Display phonetic pronunciation guide"
                    checked={settings.showTransliteration}
                    onChange={(checked) => updateSettings({ showTransliteration: checked })}
                  />
                </div>
              </div>
              
              {/* Volume Control */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="volume">🔊</span>
                  Volume Control
                </h3>
                
                <div className="glass-morphism p-4 rounded-xl border border-white/10 hover:border-purple-400/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">Master Volume</span>
                    <span className="text-white/90 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                      {Math.round(settings.volume * 100)}%
                    </span>
                  </div>
                  
                  {/* Custom Volume Slider */}
                  <div className="space-y-3">
                    <VolumeSlider
                      value={settings.volume}
                      onChange={handleVolumeChange}
                      className="w-full"
                    />
                    
                    {/* Volume level indicators */}
                    <div className="flex justify-between text-xs text-white/50">
                      <span>🔇</span>
                      <span>🔉</span>
                      <span>🔊</span>
                    </div>
                  </div>
                  
                  {/* Quick volume presets */}
                  <div className="flex gap-2 mt-4">
                    {[0.25, 0.5, 0.75, 1.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleVolumeChange(preset)}
                        className={`
                          flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200
                          ${Math.abs(settings.volume - preset) < 0.01
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                          }
                        `}
                      >
                        {Math.round(preset * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 border-t border-white/10 p-6">
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="group flex items-center gap-2 glass-morphism px-6 py-3 rounded-full hover:bg-red-500/20 transition-all duration-300"
              >
                <svg className="w-4 h-4 text-red-300 group-hover:animate-spin" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span className="text-white text-sm font-medium">Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-xl"></div>
        </div>
      </div>
    </div>,
    modalRoot
  );
}