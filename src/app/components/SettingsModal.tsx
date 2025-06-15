'use client';

import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';
import { ToggleSwitch, VolumeSlider, SettingsSection } from './ui'; // Updated import
import { useVolumeControl } from '../hooks/useVolumeControl'; // New hook import
import { useModalFocus } from '../hooks/useModalFocus'; // New hook import

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { controls } = useAudio();
  const { modalRef } = useModalFocus(isOpen); // Use the new hook

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleAutoplayToggle = useCallback((enabled: boolean) => {
    updateSettings({ autoplay: enabled });
  }, [updateSettings]);

  const { volume, setVolume } = useVolumeControl(); // Use the new volume control hook

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
            <SettingsSection title="Audio Settings" icon="🎵">
              <ToggleSwitch
                id="autoplay-toggle"
                label="Autoplay Verses"
                description="Automatically play the next verse when current verse ends"
                checked={settings.autoplay}
                onChange={handleAutoplayToggle}
              />
              
              <ToggleSwitch
                id="autoscroll-toggle"
                label="Auto-scroll during Playback"
                description="Automatically scroll to follow the audio playback for hands-free reading"
                checked={settings.autoScroll}
                onChange={(checked) => updateSettings({ autoScroll: checked })}
              />
              
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
            </SettingsSection>
            
            {/* Volume Control */}
            <SettingsSection title="Volume Control" icon="🔊">
              <div className="glass-morphism p-4 rounded-xl border border-white/10 hover:border-purple-400/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Master Volume</span>
                  <span className="text-white/90 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                
                <div className="space-y-3">
                  <VolumeSlider
                    value={volume}
                    onChange={setVolume}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-white/50">
                    <span>🔇</span>
                    <span>🔉</span>
                    <span>🔊</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {[0.25, 0.5, 0.75, 1.0].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setVolume(preset)}
                      className={`
                        flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200
                        ${Math.abs(volume - preset) < 0.01
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
            </SettingsSection>
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