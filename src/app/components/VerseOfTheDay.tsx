'use client';

import React, { useState, useEffect } from 'react';
import { ClickableVerseContainer } from './ClickableVerseContainer';
import { getVerseOfTheDay, getSurahName } from '../utils/quranApi';
import TransliterationDisplay from './TransliterationDisplay';

interface Verse {
  surah: number;
  verse: number;
  arabicText: string;
  transliteration: string;
  translation: string;
  surahName: string;
}

export function VerseOfTheDay() {
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVerseOfTheDay = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const verseData = await getVerseOfTheDay();
        const surahName = await getSurahName(verseData.surahId);
        
        const verse: Verse = {
          surah: verseData.surahId,
          verse: verseData.numberInSurah,
          arabicText: verseData.text,
          transliteration: verseData.transliteration || '', // Now includes transliteration from API
          translation: verseData.translation || '',
          surahName: surahName
        };
        
        setCurrentVerse(verse);
      } catch (err) {
        console.error('Error loading verse of the day:', err);
        setError('Failed to load verse of the day');
        
        // Fallback to a default verse with escaped apostrophe
        setCurrentVerse({
          surah: 1,
          verse: 1,
          arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          transliteration: "Bismillahi'r-rahmani'r-raheem",
          translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
          surahName: "Al-Fatiha"
        });
      } finally {
        setLoading(false);
      }
    };

    loadVerseOfTheDay();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Verse of the Day
          </h2>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/30 border-t-gold mb-4"></div>
            <p className="text-white/70 text-lg">Loading today&apos;s verse...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentVerse) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Verse of the Day
          </h2>
        </div>
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-lg">{error || 'Failed to load verse'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Verse of the Day
        </h2>
        <p className="text-gray-300 text-sm md:text-base">
          {currentVerse.surahName} ({currentVerse.surah}:{currentVerse.verse})
        </p>
      </div>

      {/* Main Verse Container */}
      <ClickableVerseContainer
        surah={currentVerse.surah}
        verse={currentVerse.verse}
        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 md:p-8 shadow-2xl"
        verseText={currentVerse.arabicText}
        surahName={currentVerse.surahName}
        translation={currentVerse.translation}
      >
        <div className="space-y-6">
          {/* Arabic Text */}
          <div className="text-center">
            <div 
              className="text-2xl md:text-4xl lg:text-5xl leading-relaxed font-arabic text-white"
              style={{ fontFamily: 'var(--font-amiri)' }}
              dir="rtl"
            >
              {currentVerse.arabicText}
            </div>
          </div>

          {/* Transliteration */}
          <div className="text-center">
            <TransliterationDisplay 
              transliteration={currentVerse.transliteration}
              size="large"
              showLabel={true}
            />
          </div>

          {/* Translation */}
          <div className="text-center border-t border-gray-600/50 pt-6">
            <p className="text-gray-100 text-base md:text-lg leading-relaxed">
              {currentVerse.translation}
            </p>
          </div>
        </div>
      </ClickableVerseContainer>

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          Click anywhere on the verse card to play audio recitation
        </p>
      </div>
    </div>
  );
}

interface VerseCardProps {
  verse: Verse;
  className?: string;
}

export function VerseCard({ verse, className = '' }: VerseCardProps) {
  return (
    <ClickableVerseContainer
      surah={verse.surah}
      verse={verse.verse}
      className={`bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800/50 transition-all duration-200 ${className}`}
      verseText={verse.arabicText}
      surahName={verse.surahName}
      translation={verse.translation}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400 font-medium">
            {verse.surahName} {verse.surah}:{verse.verse}
          </div>
        </div>

        {/* Arabic Text */}
        <div 
          className="text-right text-xl leading-relaxed font-arabic text-white"
          style={{ fontFamily: 'var(--font-amiri)' }}
          dir="rtl"
        >
          {verse.arabicText}
        </div>

        {/* Transliteration */}
        <TransliterationDisplay 
          transliteration={verse.transliteration}
          size="small"
          className="my-2"
        />

        {/* Translation */}
        <div className="text-gray-200 text-sm leading-relaxed border-t border-gray-700/50 pt-3">
          {verse.translation}
        </div>
      </div>
    </ClickableVerseContainer>
  );
}

interface VerseListProps {
  verses?: Verse[];
  title?: string;
  className?: string;
}

export function VerseList({
  verses = [],
  title = "Featured Verses",
  className = ''
}: VerseListProps) {
  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      <div className="grid gap-4 md:gap-6">
        {verses.map((verse) => (
          <VerseCard
            key={`${verse.surah}:${verse.verse}`}
            verse={verse}
          />
        ))}
      </div>
    </div>
  );
}