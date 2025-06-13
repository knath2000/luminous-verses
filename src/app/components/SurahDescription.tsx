'use client';

import useSurahDescription from '../hooks/useSurahDescription';
import SurahDetails from './SurahDetails'; // Import the new SurahDetails component

interface SurahMetadata {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface SurahDescriptionProps {
  surah: SurahMetadata;
  onContinueReading: () => void;
  onBack: () => void;
}

const SurahDescription = ({ surah, onContinueReading, onBack }: SurahDescriptionProps) => {
  const { data: description, loading, error } = useSurahDescription(surah.number);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white/70 text-sm">Loading surah information...</p>
      </div>
    );
  }

  if (error || !description) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-white/70 text-sm text-center">
          {error || 'Unable to load surah information'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SurahDetails 
        description={description} 
        onBack={onBack} 
        onContinueReading={onContinueReading} 
        isHeader={false} 
      />
    </div>
  );
};

export default SurahDescription;