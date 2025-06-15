/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDragInteractionProps {
  onDrag: (clientX: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  ref: React.RefObject<HTMLElement | null>; // Changed to allow null
}

export function useDragInteraction({ onDrag, onDragStart, onDragEnd, ref }: UseDragInteractionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (ref.current && ref.current.contains(e.target as Node)) {
      setIsDragging(true);
      onDragStart?.();
      onDrag(e.clientX);
    }
  }, [onDrag, onDragStart, ref]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onDrag(e.clientX);
    }
  }, [isDragging, onDrag]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (ref.current && ref.current.contains(e.target as Node)) {
      setIsDragging(true);
      onDragStart?.();
      if (e.touches[0]) {
        onDrag(e.touches[0].clientX);
      }
    }
  }, [onDrag, onDragStart, ref]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      onDrag(e.touches[0].clientX);
    }
  }, [isDragging, onDrag]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return { isDragging };
}