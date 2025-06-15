import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAudio } from '../contexts/AudioContext';

export function useVolumeControl() {
  const { settings, updateSettings } = useSettings();
  const { controls } = useAudio();
  
  const setVolume = useCallback((volume: number) => {
    updateSettings({ volume });
    controls.setVolume(volume);
  }, [updateSettings, controls]);
  
  return { volume: settings.volume, setVolume };
}