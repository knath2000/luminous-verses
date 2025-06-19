/**
 * Navigation Constants for Luminous Verses
 * Extracted from magic numbers to improve maintainability
 */

// Jump to Verse Feature
export const VERSE_NAVIGATION_THRESHOLD = 10; // Show jump button for surahs with more than this many verses
export const SCROLL_ANIMATION_DELAY = 400; // Milliseconds to wait after scroll animation
export const VERSE_GRID_PAGE_SIZE = 50; // Number of verses to render per virtualized page
export const VERSE_GRID_OVERSCAN = 5; // Number of extra items to render outside viewport

// Scroll Behavior
export const SCROLL_TO_VERSE_ALIGN = 'center' as const; // Default alignment for scrollToItem
export const MODAL_FADE_DURATION = 300; // Modal animation duration
export const HEADER_FADE_START = 0; // Scroll position where header starts fading
export const HEADER_FADE_END = 100; // Scroll position where header is fully faded

// Performance
export const DEBOUNCE_DELAY = 150; // Debounce delay for search input
export const VIRTUALIZATION_THRESHOLD = 50; // Use virtualization for grids larger than this

// Keyboard Shortcuts
export const SEARCH_FOCUS_KEY = '/';
export const MODAL_CLOSE_KEY = 'Escape';
export const VERSE_SELECT_KEY = 'Enter';

// Grid Layout
export const VERSE_GRID_COLUMNS = {
  mobile: 4,
  tablet: 6,
  desktop: 8,
} as const;

export const VERSE_BUTTON_HEIGHT = 48; // Height in pixels for verse buttons
export const VERSE_BUTTON_GAP = 8; // Gap between verse buttons in pixels 