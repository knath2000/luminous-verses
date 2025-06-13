// Audio system TypeScript interfaces and types

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
}

export interface VerseAudio {
  surah: number;
  verse: number;
  url: string;
  buffer?: AudioBuffer;
  lastAccessed?: number;
}

export interface AudioContextState {
  context: AudioContext | null;
  isUnlocked: boolean;
  isSupported: boolean;
}

export interface AudioPoolConfig {
  maxCacheSize: number;
  preloadNext: boolean;
  preloadPrevious: boolean;
  cacheExpiryMs: number;
}

export interface AudioPlaybackOptions {
  startTime?: number;
  volume?: number;
  fadeIn?: boolean;
  fadeInDuration?: number;
}

export interface AudioControls {
  play: (surah: number, verse: number, options?: AudioPlaybackOptions) => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  preload: (surah: number, verse: number) => Promise<void>;
}

export interface UserGestureState {
  hasInteracted: boolean;
  audioUnlocked: boolean;
  lastInteraction: number | null;
}

export type AudioEvent =
  | 'play'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'ended'
  | 'error'
  | 'loadstart'
  | 'loadend'
  | 'timeupdate'
  | 'volumechange';

export interface AudioEventData {
  currentTime?: number;
  duration?: number;
  volume?: number;
  error?: Error | string;
  surah?: number;
  verse?: number;
}

export interface AudioEventHandler {
  (event: AudioEvent, data?: AudioEventData): void;
}

export interface ReciterInfo {
  id: string;
  name: string;
  arabicName: string;
  quality: '64' | '128' | '192';
  baseUrl: string;
}

// Default reciter configuration using environment variables
export const DEFAULT_RECITER: ReciterInfo = {
  id: process.env.NEXT_PUBLIC_AUDIO_CDN_RECITER || 'alafasy128',
  name: 'Mishary Al-Afasy',
  arabicName: 'مشاري العفاسي',
  quality: '128',
  // Use proper fallback URL that matches the expected format
  baseUrl: process.env.NEXT_PUBLIC_AUDIO_CDN_URL_TEMPLATE || 'https://everyayah.com/data/Alafasy_128_kbps/'
};

// Audio format configuration
export const AUDIO_CONFIG = {
  format: 'mp3',
  sampleRate: 44100,
  channels: 2,
  bitRate: 128
} as const;

// Browser compatibility
export const BROWSER_SUPPORT = {
  webAudio: typeof window !== 'undefined' && 'AudioContext' in window,
  htmlAudio: typeof window !== 'undefined' && 'Audio' in window,
  fetch: typeof window !== 'undefined' && 'fetch' in window
} as const;