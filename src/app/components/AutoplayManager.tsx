'use client';

import { useAutoplay } from '../hooks/useAutoplay';

/**
 * AutoplayManager component that handles automatic verse playback
 * This component doesn't render anything but manages the autoplay functionality
 * by listening to audio events and triggering next verse playback when enabled
 */
export default function AutoplayManager() {
  // Initialize the autoplay hook - this sets up all the event listeners
  useAutoplay();

  // This component doesn't render anything, it just manages autoplay logic
  return null;
}