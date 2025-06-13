# Virtualized Verse List Refinement Implementation Plan

## Overview
This document provides a detailed implementation plan to fix the overlapping verse cards issue in the Luminous Verses application. The solution addresses race conditions in React Window's VariableSizeList dynamic height management system.

## Root Cause Analysis

### Current Issues
1. **Race Conditions**: Height measurement and cache invalidation timing mismatches
2. **Abrupt Cache Invalidation**: `resetAfterIndex(0)` invalidates all cached heights simultaneously
3. **Asynchronous Measurement**: `useResizeObserver` with `requestAnimationFrame` creates timing gaps
4. **Settings Toggle Impact**: Translation/transliteration toggles cause dramatic height changes (100-200px per verse)

### Research-Based Solutions
Based on Perplexity research and React Window best practices:
- Use `useLayoutEffect` for synchronous DOM measurement
- Implement gradual cache invalidation instead of complete reset
- Add debouncing to prevent rapid successive invalidations
- Ensure measurements complete before cache updates

## Implementation Plan

### Phase 1: Enhanced Dynamic Height Hook

Create `src/app/hooks/useImprovedDynamicItemSize.ts`:

```typescript
import { useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { VariableSizeListProps } from 'react-window';

interface ImprovedDynamicItemSizeOptions {
  estimateSize?: (index: number) => number;
  debounceMs?: number;
  maxRetries?: number;
}

export function useImprovedDynamicItemSize(
  listRef: React.RefObject<any>,
  options: ImprovedDynamicItemSizeOptions = {}
) {
  const {
    estimateSize = () => 600, // Default estimate
    debounceMs = 16, // One frame
    maxRetries = 3
  } = options;

  const sizeMap = useRef<Record<number, number>>({});
  const pendingUpdates = useRef<Set<number>>(new Set());
  const debounceTimer = useRef<NodeJS.Timeout>();
  const measurementQueue = useRef<Map<number, number>>(new Map());
  const retryCount = useRef<Record<number, number>>({});

  // Enhanced size estimation based on content
  const getEstimatedSize = useCallback((index: number, verse?: any) => {
    if (verse) {
      // Content-aware estimation
      const baseHeight = 120; // Base container height
      const arabicHeight = Math.max(60, Math.ceil(verse.text_uthmani?.length / 50) * 30);
      const transliterationHeight = verse.transliteration ? 40 : 0;
      const translationHeight = verse.translation ? Math.ceil(verse.translation.length / 80) * 20 : 0;
      
      return baseHeight + arabicHeight + transliterationHeight + translationHeight;
    }
    return estimateSize(index);
  }, [estimateSize]);

  // Debounced cache invalidation
  const debouncedInvalidation = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (pendingUpdates.current.size > 0 && listRef.current) {
        const minIndex = Math.min(...Array.from(pendingUpdates.current));
        
        // Gradual invalidation: only reset from the minimum changed index
        listRef.current.resetAfterIndex(minIndex, true);
        pendingUpdates.current.clear();
      }
    }, debounceMs);
  }, [debounceMs]);

  // Synchronous size setting with validation
  const setSize = useCallback((index: number, size: number) => {
    // Validate size
    if (size <= 0 || !isFinite(size)) {
      console.warn(`Invalid size for index ${index}: ${size}`);
      return;
    }

    const currentSize = sizeMap.current[index];
    const sizeDifference = Math.abs(currentSize - size);
    
    // Only update if size changed significantly (avoid micro-adjustments)
    if (!currentSize || sizeDifference > 5) {
      sizeMap.current = { ...sizeMap.current, [index]: size };
      pendingUpdates.current.add(index);
      
      // Reset retry count on successful measurement
      retryCount.current[index] = 0;
      
      debouncedInvalidation();
    }
  }, [debouncedInvalidation]);

  // Enhanced size getter with fallback logic
  const getSize = useCallback((index: number, verse?: any) => {
    const cachedSize = sizeMap.current[index];
    
    if (cachedSize && cachedSize > 0) {
      return cachedSize;
    }

    // Use content-aware estimation
    const estimatedSize = getEstimatedSize(index, verse);
    
    // Store estimation temporarily
    if (!cachedSize) {
      sizeMap.current[index] = estimatedSize;
    }
    
    return estimatedSize;
  }, [getEstimatedSize]);

  // Batch reset for settings changes
  const resetAllSizes = useCallback((newEstimator?: (index: number) => number) => {
    // Clear all cached sizes
    sizeMap.current = {};
    pendingUpdates.current.clear();
    retryCount.current = {};
    
    // Update estimator if provided
    if (newEstimator) {
      // Re-estimate all known indices
      Object.keys(sizeMap.current).forEach(indexStr => {
        const index = parseInt(indexStr);
        sizeMap.current[index] = newEstimator(index);
      });
    }
    
    // Force complete re-measurement
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, []);

  // Cleanup on unmount
  useLayoutEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    getSize,
    setSize,
    resetAllSizes,
    sizeMap: sizeMap.current
  };
}
```

### Phase 2: Enhanced Resize Observer Hook

Update `src/app/hooks/useResizeObserver.ts`:

```typescript
import { useRef, useState, RefObject, useLayoutEffect, useCallback } from 'react';

type Size = {
  width: number;
  height: number;
};

interface ResizeObserverOptions {
  onResize?: (size: Size) => void;
  debounceMs?: number;
  threshold?: number; // Minimum change to trigger callback
}

function useResizeObserver<T extends HTMLElement = HTMLElement>(
  options: ResizeObserverOptions = {}
): [RefObject<T | null>, Size] {
  const { onResize, debounceMs = 0, threshold = 1 } = options;
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const debounceTimer = useRef<NodeJS.Timeout>();
  const lastSize = useRef<Size>({ width: 0, height: 0 });

  const debouncedCallback = useCallback((newSize: Size) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (debounceMs > 0) {
      debounceTimer.current = setTimeout(() => {
        setSize(newSize);
        onResize?.(newSize);
      }, debounceMs);
    } else {
      setSize(newSize);
      onResize?.(newSize);
    }
  }, [onResize, debounceMs]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use synchronous measurement instead of requestAnimationFrame
        const { width, height } = entry.contentRect;
        const newSize = { width, height };
        
        // Only trigger callback if change is significant
        const widthDiff = Math.abs(newSize.width - lastSize.current.width);
        const heightDiff = Math.abs(newSize.height - lastSize.current.height);
        
        if (widthDiff >= threshold || heightDiff >= threshold) {
          lastSize.current = newSize;
          debouncedCallback(newSize);
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debouncedCallback, threshold]);

  return [ref, size];
}

export default useResizeObserver;
```

### Phase 3: Enhanced Verse Item Component

Update `src/app/components/VerseItem.tsx` (or create if it doesn't exist):

```typescript
import React, { memo, useLayoutEffect, useCallback } from 'react';
import { areEqual } from 'react-window';
import ClickableVerseContainer from './ClickableVerseContainer';
import useResizeObserver from '../hooks/useResizeObserver';

interface VerseItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    verses: any[];
    setSize: (index: number, size: number) => void;
    settings: any;
  };
}

const VerseItem = memo<VerseItemProps>(({ index, style, data }) => {
  const { verses, setSize, settings } = data;
  const verse = verses[index];

  // Enhanced resize observer with debouncing
  const [ref, size] = useResizeObserver<HTMLDivElement>({
    onResize: useCallback((newSize) => {
      // Add buffer for spacing and ensure minimum height
      const adjustedHeight = Math.max(newSize.height + 24, 100);
      setSize(index, adjustedHeight);
    }, [index, setSize]),
    debounceMs: 16, // One frame delay
    threshold: 5 // Minimum 5px change to trigger update
  });

  // Ensure measurement happens after content changes
  useLayoutEffect(() => {
    if (ref.current && size.height > 0) {
      const adjustedHeight = Math.max(size.height + 24, 100);
      setSize(index, adjustedHeight);
    }
  }, [settings.showTransliteration, settings.showTranslation, index, setSize, size.height]);

  if (!verse) {
    return <div style={style}>Loading...</div>;
  }

  return (
    <div style={style}>
      <div ref={ref} className="verse-item-container">
        <ClickableVerseContainer
          verse={verse}
          verseIndex={index}
          showTransliteration={settings.showTransliteration}
          showTranslation={settings.showTranslation}
        />
      </div>
    </div>
  );
}, areEqual);

VerseItem.displayName = 'VerseItem';

export default VerseItem;
```

### Phase 4: Enhanced Virtualized Verse List

Update `src/app/components/VirtualizedVerseList.tsx`:

```typescript
import React, { useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import { useSettings } from '../contexts/SettingsContext';
import { useImprovedDynamicItemSize } from '../hooks/useImprovedDynamicItemSize';
import VerseItem from './VerseItem';

interface VirtualizedVerseListProps {
  verses: any[];
  height: number;
  width: number;
}

const VirtualizedVerseList: React.FC<VirtualizedVerseListProps> = ({
  verses,
  height,
  width
}) => {
  const { settings } = useSettings();
  const listRef = useRef<List>(null);

  // Enhanced dynamic sizing with content-aware estimation
  const { getSize, setSize, resetAllSizes } = useImprovedDynamicItemSize(listRef, {
    estimateSize: useCallback((index: number) => {
      const verse = verses[index];
      if (!verse) return 600;

      // Content-aware size estimation
      const baseHeight = 120;
      const arabicHeight = Math.max(60, Math.ceil(verse.text_uthmani?.length / 50) * 30);
      const transliterationHeight = settings.showTransliteration && verse.transliteration ? 40 : 0;
      const translationHeight = settings.showTranslation && verse.translation 
        ? Math.ceil(verse.translation.length / 80) * 20 
        : 0;
      
      return baseHeight + arabicHeight + transliterationHeight + translationHeight;
    }, [verses, settings.showTransliteration, settings.showTranslation]),
    debounceMs: 32, // Two frames for smoother updates
    maxRetries: 3
  });

  // Enhanced item data with stable reference
  const itemData = useMemo(() => ({
    verses,
    setSize,
    settings: {
      showTransliteration: settings.showTransliteration,
      showTranslation: settings.showTranslation
    }
  }), [verses, setSize, settings.showTransliteration, settings.showTranslation]);

  // Handle settings changes with improved cache management
  useLayoutEffect(() => {
    // Create new estimator based on current settings
    const newEstimator = (index: number) => {
      const verse = verses[index];
      if (!verse) return 600;

      const baseHeight = 120;
      const arabicHeight = Math.max(60, Math.ceil(verse.text_uthmani?.length / 50) * 30);
      const transliterationHeight = settings.showTransliteration && verse.transliteration ? 40 : 0;
      const translationHeight = settings.showTranslation && verse.translation 
        ? Math.ceil(verse.translation.length / 80) * 20 
        : 0;
      
      return baseHeight + arabicHeight + transliterationHeight + translationHeight;
    };

    // Reset with new estimator
    resetAllSizes(newEstimator);
  }, [settings.showTransliteration, settings.showTranslation, verses, resetAllSizes]);

  // Enhanced item size getter
  const getItemSize = useCallback((index: number) => {
    return getSize(index, verses[index]);
  }, [getSize, verses]);

  if (!verses.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">No verses available</div>
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      width={width}
      itemCount={verses.length}
      itemSize={getItemSize}
      itemData={itemData}
      overscanCount={5} // Render 5 extra items for smoother scrolling
      useIsScrolling={true} // Enable scroll-aware rendering
    >
      {VerseItem}
    </List>
  );
};

export default VirtualizedVerseList;
```

### Phase 5: CSS Enhancements

Add to `src/app/globals.css`:

```css
/* Enhanced verse item styling for better height stability */
.verse-item-container {
  /* Ensure consistent box-sizing */
  box-sizing: border-box;
  
  /* Prevent layout shifts during measurement */
  contain: layout style;
  
  /* Smooth transitions for height changes */
  transition: height 0.2s ease-out;
}

/* Prevent content jumping during resize */
.verse-item-container * {
  box-sizing: border-box;
}

/* Loading state styling */
.verse-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  opacity: 0.6;
}

/* Smooth height transitions for settings toggles */
@media (prefers-reduced-motion: no-preference) {
  .verse-item-container {
    transition: height 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .verse-item-container {
    transition: none;
  }
}
```

## Implementation Steps

### Step 1: Create Enhanced Hooks
1. Create `useImprovedDynamicItemSize.ts` with the code above
2. Update `useResizeObserver.ts` with enhanced functionality

### Step 2: Update Components
1. Create or update `VerseItem.tsx` component
2. Update `VirtualizedVerseList.tsx` with enhanced logic

### Step 3: Add CSS Enhancements
1. Add the CSS rules to `globals.css`

### Step 4: Testing & Validation
1. Test translation/transliteration toggles
2. Verify no overlapping occurs
3. Test with long verses (like Ayat al-Kursi)
4. Validate smooth scrolling performance

## Expected Outcomes

### Performance Improvements
- **Eliminated Overlapping**: Proper synchronization between measurement and cache invalidation
- **Smoother Transitions**: Debounced updates and CSS transitions
- **Better Estimation**: Content-aware height estimation reduces measurement iterations
- **Reduced Layout Shifts**: Stable height calculations with minimum change thresholds

### User Experience Enhancements
- **Seamless Settings Toggles**: No jarring jumps when toggling translation/transliteration
- **Consistent Spacing**: Proper buffer calculations maintain visual consistency
- **Responsive Design**: Better handling of different screen sizes and text lengths
- **Accessibility**: Respects reduced motion preferences

## Monitoring & Debugging

### Debug Tools
Add these debugging utilities for development:

```typescript
// Add to development environment
if (process.env.NODE_ENV === 'development') {
  // Height debugging
  window.debugVerseHeights = () => {
    console.table(sizeMap.current);
  };
  
  // Performance monitoring
  window.debugVersePerformance = () => {
    console.log('Pending updates:', pendingUpdates.current.size);
    console.log('Retry counts:', retryCount.current);
  };
}
```

### Performance Metrics
Monitor these metrics:
- Time between settings toggle and stable layout
- Number of height recalculations per toggle
- Scroll performance (FPS)
- Memory usage of size cache

This implementation plan addresses all identified issues with the virtualized verse list system and provides a robust, performant solution for dynamic height management in React Window.