'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines: number;
  dir: 'ltr' | 'rtl';
  lang: string;
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
  onToggle?: (expanded: boolean) => void;
  onHeightChange?: (newHeight: number) => void;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLines,
  dir,
  lang,
  className = '',
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
  onToggle,
  onHeightChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkOverflow = useCallback(() => {
    if (textRef.current && contentRef.current) {
      const currentHeight = contentRef.current.offsetHeight;
      contentRef.current.style.webkitLineClamp = 'unset'; // Temporarily unset to get full height
      const naturalHeight = contentRef.current.offsetHeight;
      contentRef.current.style.webkitLineClamp = expanded ? 'unset' : String(maxLines); // Restore clamp

      setShowButton(naturalHeight > currentHeight);
    }
  }, [expanded, maxLines]);

  useEffect(() => {
    checkOverflow();
    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text, maxLines, checkOverflow]);

  useEffect(() => {
    if (onHeightChange && textRef.current) {
      const observer = new ResizeObserver(() => {
        onHeightChange(textRef.current?.offsetHeight || 0);
      });
      observer.observe(textRef.current);
      return () => observer.disconnect();
    }
  }, [onHeightChange]);

  const handleToggle = () => {
    setExpanded((prev) => {
      const newState = !prev;
      onToggle?.(newState);
      return newState;
    });
  };

  return (
    <div ref={textRef} className={`relative ${className}`} dir={dir} lang={lang}>
      <div
        ref={contentRef}
        className="transition-all duration-300 ease-in-out"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : String(maxLines),
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </div>
      {showButton && (
        <button
          onClick={handleToggle}
          className="mt-2 text-gold hover:text-gold-bright flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50 rounded-md"
          aria-expanded={expanded}
        >
          {expanded ? collapseLabel : expandLabel}
          {expanded ? (
            <ChevronUp size={16} className="ml-1" />
          ) : (
            <ChevronDown size={16} className="ml-1" />
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;