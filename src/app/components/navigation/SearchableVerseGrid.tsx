'use client';

import React, { useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { SearchableVerseGridProps } from '../../types/navigation';
import { 
  VERSE_GRID_COLUMNS, 
  VERSE_BUTTON_HEIGHT, 
  VERSE_BUTTON_GAP,
  VERSE_GRID_OVERSCAN,
  VIRTUALIZATION_THRESHOLD,
} from '../../constants/navigation';
import { VersePill } from './VersePill';

interface GridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    filteredVerses: number[];
    columnsPerRow: number;
    selectedVerse?: number;
    onVerseSelect: (verseNumber: number) => void;
  };
}

function GridCell({ columnIndex, rowIndex, style, data }: GridCellProps) {
  const { filteredVerses, columnsPerRow, selectedVerse, onVerseSelect } = data;
  const verseIndex = rowIndex * columnsPerRow + columnIndex;
  const verseNumber = filteredVerses[verseIndex];

  if (!verseNumber) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="p-1">
      <VersePill
        number={verseNumber}
        selected={verseNumber === selectedVerse}
        onClick={() => onVerseSelect(verseNumber)}
      />
    </div>
  );
}

export function SearchableVerseGrid({
  totalVerses,
  onVerseSelect,
  searchQuery = '',
  selectedVerse,
  virtualized = true,
  itemHeight = VERSE_BUTTON_HEIGHT + VERSE_BUTTON_GAP * 2,
  overscanCount = VERSE_GRID_OVERSCAN,
}: SearchableVerseGridProps) {
  
  // Filter verses based on search query
  const filteredVerses = useMemo(() => {
    if (!searchQuery.trim()) {
      return Array.from({ length: totalVerses }, (_, i) => i + 1);
    }
    
    const query = searchQuery.toLowerCase();
    const results: number[] = [];
    
    for (let i = 1; i <= totalVerses; i++) {
      if (i.toString().includes(query)) {
        results.push(i);
      }
    }
    
    return results;
  }, [totalVerses, searchQuery]);

  // Responsive column calculation
  const columnsPerRow = useMemo(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return VERSE_GRID_COLUMNS.mobile;
      if (width < 1024) return VERSE_GRID_COLUMNS.tablet;
      return VERSE_GRID_COLUMNS.desktop;
    }
    return VERSE_GRID_COLUMNS.desktop;
  }, []);

  const rowCount = Math.ceil(filteredVerses.length / columnsPerRow);
  const shouldVirtualize = virtualized && filteredVerses.length > VIRTUALIZATION_THRESHOLD;

  // Grid data for virtualized rendering
  const gridData = useMemo(() => ({
    filteredVerses,
    columnsPerRow,
    selectedVerse,
    onVerseSelect,
  }), [filteredVerses, columnsPerRow, selectedVerse, onVerseSelect]);

  // Handle verse selection
  const handleVerseSelect = useCallback((verseNumber: number) => {
    onVerseSelect(verseNumber);
  }, [onVerseSelect]);

  // Non-virtualized grid for smaller lists
  if (!shouldVirtualize) {
    return (
      <div 
        className="grid gap-2 p-4"
        style={{
          gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`,
        }}
      >
        {filteredVerses.map((verseNumber) => (
          <VersePill
            key={verseNumber}
            number={verseNumber}
            selected={verseNumber === selectedVerse}
            onClick={() => handleVerseSelect(verseNumber)}
          />
        ))}
      </div>
    );
  }

  // Virtualized grid for large lists
  return (
    <div className="p-4">
      <Grid
        height={Math.min(400, rowCount * itemHeight)} // Max height of 400px
        width={600} // Fixed width for now
        columnCount={columnsPerRow}
        columnWidth={Math.floor(568 / columnsPerRow)} // Account for padding (600 - 32)
        rowCount={rowCount}
        rowHeight={itemHeight}
        overscanCount={overscanCount}
        itemData={gridData}
      >
        {GridCell}
      </Grid>
    </div>
  );
}

// Helper hook for responsive column count
export function useResponsiveColumns() {
  const [columns, setColumns] = React.useState<number>(VERSE_GRID_COLUMNS.desktop);

  React.useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(VERSE_GRID_COLUMNS.mobile);
      } else if (width < 1024) {
        setColumns(VERSE_GRID_COLUMNS.tablet);
      } else {
        setColumns(VERSE_GRID_COLUMNS.desktop);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
} 