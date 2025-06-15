import React from 'react';

interface TransliterationDisplayProps {
  transliteration: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const TransliterationDisplay: React.FC<TransliterationDisplayProps> = ({
  transliteration,
  size = 'medium',
  showLabel = false,
  className = '',
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
      <p className={`${textSizeClass}`}>{transliteration}</p>
    </div>
  );
};

export default TransliterationDisplay;