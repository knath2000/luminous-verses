import React from 'react';
import ExpandableText from './ExpandableText';

interface TransliterationDisplayProps {
  transliteration: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
  /** If true, long transliteration text will be clamped and toggleable */
  expandable?: boolean;
  /** Maximum visible lines when expandable is true */
  maxLines?: number;
}

const TransliterationDisplay: React.FC<TransliterationDisplayProps> = ({
  transliteration,
  size = 'medium',
  showLabel = false,
  className = '',
  expandable = false,
  maxLines = 3,
}) => {
  const textSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[size];

  return (
    <div className={`transliteration-display ${className}`}>
      {showLabel && (
        <p className={`font-semibold mb-1 ${textSizeClass}`}>Transliteration:</p>
      )}
      {expandable ? (
        <ExpandableText
          text={transliteration}
          maxLines={maxLines}
          dir="ltr"
          lang="en"
          className={`${textSizeClass}`}
        />
      ) : (
        <p className={`${textSizeClass}`}>{transliteration}</p>
      )}
    </div>
  );
};

export default TransliterationDisplay;