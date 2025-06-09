'use client';

/**
 * Utility functions for auto-scrolling functionality
 * Based on research from Perplexity and Context7 MCP tools
 */

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Smooth scroll to element with accessibility considerations
export function scrollToElement(
  elementId: string,
  options: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
    offset?: number;
    forceHighlight?: boolean;
  } = {}
): boolean {
  if (typeof window === 'undefined') return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`🔄 scrollUtils: Element with ID "${elementId}" not found`);
    return false;
  }

  // Always highlight the element, even if we don't scroll
  highlightElement(element);

  // Check if element is already well-positioned (only skip scroll if very centered)
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const elementCenter = rect.top + rect.height / 2;
  const windowCenter = windowHeight / 2;
  const distanceFromCenter = Math.abs(elementCenter - windowCenter);
  
  // Only skip scrolling if element is very close to center (within 100px)
  const isWellCentered = distanceFromCenter < 100 && rect.top >= 0 && rect.bottom <= windowHeight;
  
  if (isWellCentered && !options.forceHighlight) {
    console.log(`🔄 scrollUtils: Element "${elementId}" already well-centered, highlighting only`);
    return true;
  }

  // Respect user's motion preferences
  const shouldUseSmooth = !prefersReducedMotion() && options.behavior !== 'auto';
  
  const scrollOptions: ScrollIntoViewOptions = {
    behavior: shouldUseSmooth ? (options.behavior || 'smooth') : 'auto',
    block: options.block || 'center',
    inline: options.inline || 'nearest'
  };

  try {
    element.scrollIntoView(scrollOptions);
    console.log(`🔄 scrollUtils: Scrolled to element "${elementId}"`);
    return true;
  } catch (error) {
    console.error('🔄 scrollUtils: Error scrolling to element:', error);
    return false;
  }
}

// Add temporary visual highlight to element
function highlightElement(element: HTMLElement): void {
  // Add highlight class
  element.classList.add('verse-highlight');
  
  // Remove highlight after animation
  setTimeout(() => {
    element.classList.remove('verse-highlight');
  }, 2000);
}

// Generate verse element ID
export function getVerseElementId(surah: number, verse: number): string {
  return `verse-${surah}-${verse}`;
}

// Announce verse change to screen readers
export function announceVerseChange(surah: number, verse: number, surahName?: string): void {
  if (typeof window === 'undefined') return;

  const announcement = surahName 
    ? `Now playing verse ${verse} of Surah ${surahName}`
    : `Now playing verse ${verse} of Surah ${surah}`;

  // Create or update ARIA live region
  let liveRegion = document.getElementById('verse-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'verse-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // Screen reader only
    liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(liveRegion);
  }

  // Update announcement
  liveRegion.textContent = announcement;
  
  console.log(`🔄 scrollUtils: Announced "${announcement}"`);
}

// Throttle function for performance optimization
export function throttle(func: (...args: unknown[]) => void, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: unknown[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Check if element is in viewport
export function isElementInViewport(elementId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const element = document.getElementById(elementId);
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );
}

// Get scroll position relative to element
export function getElementScrollPosition(elementId: string): {
  isVisible: boolean;
  distanceFromCenter: number;
  inViewport: boolean;
} {
  if (typeof window === 'undefined') {
    return { isVisible: false, distanceFromCenter: 0, inViewport: false };
  }

  const element = document.getElementById(elementId);
  if (!element) {
    return { isVisible: false, distanceFromCenter: 0, inViewport: false };
  }

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const elementCenter = rect.top + rect.height / 2;
  const windowCenter = windowHeight / 2;
  const distanceFromCenter = Math.abs(elementCenter - windowCenter);
  
  const inViewport = (
    rect.top >= 0 &&
    rect.bottom <= windowHeight
  );

  const isVisible = inViewport && rect.height > 0 && rect.width > 0;

  return {
    isVisible,
    distanceFromCenter,
    inViewport
  };
}