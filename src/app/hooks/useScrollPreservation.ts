import { useRef, useCallback, useState, useEffect } from 'react';

interface ScrollState {
  surahListPosition: number;           // Regular DOM scroll position
  verseScrollPosition: number;         // react-window scroll position
  verseScrollIndex: number;            // Current verse index for more precise restoration
  selectedSurahNumber: number | null;  // Track which surah's verses are being viewed
  lastActiveView: 'list' | 'detail';   // Track which view was active when modal was closed
}

// Storage key for sessionStorage persistence
const SCROLL_STATE_KEY = 'luminous-verses-scroll-state';

export const useScrollPreservation = () => {
  // Load initial state from sessionStorage or use defaults
  const [scrollState, setScrollState] = useState<ScrollState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(SCROLL_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('📂 Loaded scroll state from sessionStorage:', parsed);
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to load scroll state from sessionStorage:', error);
      }
    }
    
    return {
      surahListPosition: 0,
      verseScrollPosition: 0,
      verseScrollIndex: 0,
      selectedSurahNumber: null,
      lastActiveView: 'list',
    };
  });

  const stateRef = useRef(scrollState);
  stateRef.current = scrollState;

  // Refs for tracking scroll containers
  const surahListScrollRef = useRef<HTMLDivElement>(null);
  const verseListRef = useRef<{ scrollToItem: (index: number, align?: string) => void; scrollTo: (offset: number) => void }>(null);
  
  // Debounced persistence to sessionStorage
  const saveTimeoutRef = useRef<number | null>(null);
  
  const persistScrollState = useCallback((state: ScrollState) => {
    if (typeof window !== 'undefined') {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce save to avoid excessive sessionStorage writes
      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          sessionStorage.setItem(SCROLL_STATE_KEY, JSON.stringify(state));
          console.log('💾 Persisted scroll state to sessionStorage:', state);
        } catch (error) {
          console.warn('Failed to persist scroll state to sessionStorage:', error);
        }
      }, 300); // 300ms debounce
    }
  }, []);

  const persistNow = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      try {
        const currentState = stateRef.current;
        sessionStorage.setItem(SCROLL_STATE_KEY, JSON.stringify(currentState));
        console.log('💾 IMMEDIATE PERSIST - state saved:', currentState);
      } catch (error) {
        console.warn('Failed to persist scroll state synchronously:', error);
      }
    }
  }, []);

  // Immediately persist with a specific lastActiveView (bypasses React state timing issues)
  const persistWithLastActiveView = useCallback((lastActiveView: 'list' | 'detail') => {
    if (typeof window !== 'undefined') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      try {
        // Create the updated state with the correct lastActiveView
        const updatedState = {
          ...stateRef.current,
          lastActiveView: lastActiveView
        };
        
        // Update the ref immediately so it's in sync
        stateRef.current = updatedState;
        
        // Persist to sessionStorage
        sessionStorage.setItem(SCROLL_STATE_KEY, JSON.stringify(updatedState));
        console.log('💾 IMMEDIATE PERSIST WITH LAST ACTIVE VIEW - state saved:', updatedState);
        
        // Also update React state (this will happen asynchronously but that's fine)
        setScrollState(updatedState);
      } catch (error) {
        console.warn('Failed to persist scroll state with lastActiveView:', error);
      }
    }
  }, []);

  // Effect to persist scroll state changes to sessionStorage
  useEffect(() => {
    persistScrollState(scrollState);
  }, [scrollState, persistScrollState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Save surah list scroll position
  const saveSurahListPosition = useCallback(() => {
    if (surahListScrollRef.current) {
      const position = surahListScrollRef.current.scrollTop;
      setScrollState(prev => ({
        ...prev,
        surahListPosition: position,
      }));
      console.log('💾 Saved surah list scroll position:', position);
    }
  }, []);

  // Save verse list scroll position and index
  const saveVerseListPosition = useCallback((
    scrollOffset: number, 
    visibleIndex: number, 
    surahNumber: number
  ) => {
    setScrollState(prev => ({
      ...prev,
      verseScrollPosition: scrollOffset,
      verseScrollIndex: visibleIndex,
      selectedSurahNumber: surahNumber,
    }));
    console.log('💾 Saved verse list scroll - offset:', scrollOffset, 'index:', visibleIndex, 'surah:', surahNumber);
  }, []);

  // Restore surah list scroll position
  const restoreSurahListPosition = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (surahListScrollRef.current && scrollState.surahListPosition > 0) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          if (surahListScrollRef.current) {
            surahListScrollRef.current.scrollTop = scrollState.surahListPosition;
            console.log('📍 Restored surah list scroll position:', scrollState.surahListPosition);
          }
          resolve();
        }, 100);
      } else {
        resolve();
      }
    });
  }, [scrollState.surahListPosition]);

  // Restore verse list scroll position
  const restoreVerseListPosition = useCallback((surahNumber: number) => {
    return new Promise<void>((resolve) => {
      if (
        verseListRef.current && 
        scrollState.selectedSurahNumber === surahNumber &&
        (scrollState.verseScrollPosition > 0 || scrollState.verseScrollIndex > 0)
      ) {
        // Use setTimeout to ensure react-window is ready
        setTimeout(() => {
          if (verseListRef.current) {
            // First scroll to the approximate index
            if (scrollState.verseScrollIndex > 0) {
              verseListRef.current.scrollToItem(scrollState.verseScrollIndex, 'start');
            }
            
            // Then fine-tune with exact scroll offset
            setTimeout(() => {
              if (verseListRef.current && scrollState.verseScrollPosition > 0) {
                verseListRef.current.scrollTo(scrollState.verseScrollPosition);
              }
              resolve();
            }, 50);
            
            console.log('📍 Restored verse list scroll - offset:', scrollState.verseScrollPosition, 'index:', scrollState.verseScrollIndex);
          } else {
            resolve();
          }
        }, 150);
      } else {
        resolve();
      }
    });
  }, [scrollState.selectedSurahNumber, scrollState.verseScrollPosition, scrollState.verseScrollIndex]);

  // Track last active view when modal closes
  const setLastActiveView = useCallback((view: 'list' | 'detail') => {
    console.log('👁️ Setting last active view to:', view, '(previous was:', scrollState.lastActiveView, ')');
    setScrollState(prev => ({
      ...prev,
      lastActiveView: view,
    }));
  }, [scrollState.lastActiveView]);

  // Clear scroll state (useful for fresh starts)
  const clearScrollState = useCallback(() => {
    setScrollState({
      surahListPosition: 0,
      verseScrollPosition: 0,
      verseScrollIndex: 0,
      selectedSurahNumber: null,
      lastActiveView: 'list',
    });
    console.log('🧹 Cleared scroll state');
  }, []);

  // Get current scroll state for debugging
  const getScrollState = useCallback(() => scrollState, [scrollState]);

  return {
    // Current state
    scrollState,

    // Refs to attach to scrollable elements
    surahListScrollRef,
    verseListRef,
    
    // Save functions
    saveSurahListPosition,
    saveVerseListPosition,
    
    // Restore functions
    restoreSurahListPosition,
    restoreVerseListPosition,
    
    // View tracking
    setLastActiveView,
    
    // Utility functions
    clearScrollState,
    getScrollState,
    
    // New functions
    persistNow,
    persistWithLastActiveView,
  };
}; 