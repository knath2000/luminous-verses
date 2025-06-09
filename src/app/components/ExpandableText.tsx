'use client';

import { useState, useRef, useEffect } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  expandText?: string;
  collapseText?: string;
}

const ExpandableText = ({ 
  text, 
  maxLength = 200, 
  className = '',
  expandText = 'Read more ✨',
  collapseText = 'Show less ⭐'
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if text is longer than maxLength
    setShouldShowToggle(text.length > maxLength);
  }, [text, maxLength]);

  const displayText = isExpanded ? text : text.slice(0, maxLength);
  const needsEllipsis = !isExpanded && text.length > maxLength;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={contentRef}
        className={`
          transition-all duration-500 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-none' : 'max-h-32'}
        `}
      >
        <p className="text-white/90 leading-relaxed">
          {displayText}
          {needsEllipsis && (
            <span className="text-white/60">...</span>
          )}
        </p>
      </div>

      {shouldShowToggle && (
        <button
          onClick={handleToggle}
          className={`
            group mt-3 inline-flex items-center gap-2 
            glass-morphism px-4 py-2 rounded-full
            hover:bg-gradient-to-r hover:from-gold/20 hover:to-purple-500/20
            transition-all duration-300 transform hover:scale-105
            border border-white/10 hover:border-gold/40
            focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-transparent
          `}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse text' : 'Expand text'}
        >
          <span className="text-gold text-sm font-medium">
            {isExpanded ? collapseText : expandText}
          </span>
          
          <svg 
            className={`
              w-4 h-4 text-gold transition-transform duration-300
              ${isExpanded ? 'rotate-180' : 'rotate-0'}
              group-hover:animate-pulse
            `} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      )}

      {/* Decorative cosmic elements */}
      {isExpanded && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-gold/40 to-purple-500/40 rounded-full blur-sm animate-pulse"></div>
      )}
    </div>
  );
};

export default ExpandableText;