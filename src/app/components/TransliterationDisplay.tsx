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
  className = ''
}) => {
  let textSizeClass = '';
  switch (size) {
    case 'small':
      textSizeClass = 'text-xs';
      break;
    case 'medium':
      textSizeClass = 'text-sm';
      break;
    case 'large':
      textSizeClass = 'text-base md:text-lg';
      break;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showLabel && (
        <p className={`text-gold/70 ${size === 'large' ? 'text-sm' : 'text-xs'} mb-1`}>
          Transliteration:
        </p>
      )}
      <p className={`text-gray-300 italic leading-relaxed ${textSizeClass}`}>
        {transliteration}
      </p>
    </div>
  );
};

export default TransliterationDisplay;