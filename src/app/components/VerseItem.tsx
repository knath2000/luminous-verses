import React, { memo, useLayoutEffect, useCallback, useState, useEffect } from 'react';
import { areEqual } from 'react-window';
import { ClickableVerseContainer } from './ClickableVerseContainer';
import useResizeObserver from '../hooks/useResizeObserver';
import TransliterationDisplay from './TransliterationDisplay';
import VerseSkeleton from './VerseSkeleton';
import { BookmarkHeart } from './BookmarkHeart';
import { getSurahName } from '../utils/quranApi';

interface VerseItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    verses: {
      surahId: number;
      numberInSurah: number;
      text: string;
      transliteration?: string;
      translation?: string;
      text_uthmani?: string;
    }[];
    setSize: (index: number, size: number) => void;
    settings: {
      showTransliteration: boolean;
      showTranslation: boolean;
    };
  };
}

const VerseItem = memo<VerseItemProps>(({ index, style, data }) => {
  console.log(`🎭 VerseItem render - index: ${index}, style:`, style);
  const { verses, setSize, settings } = data;
  const verse = verses[index];
  console.log(`📝 VerseItem ${index} - verse:`, verse ? `${verse.surahId}:${verse.numberInSurah}` : 'undefined');

  const [surahName, setSurahName] = useState<string>('');

  // Fetch surah name when verse changes
  useEffect(() => {
    if (verse?.surahId) {
      getSurahName(verse.surahId).then(setSurahName);
    }
  }, [verse?.surahId]);

  const [ref, size] = useResizeObserver<HTMLDivElement>({
    onResize: useCallback((newSize: { width: number; height: number }) => {
      const adjustedHeight = Math.max(newSize.height + 24, 100);
      setSize(index, adjustedHeight);
    }, [index, setSize]),
    debounceMs: 16,
    threshold: 5
  });

  useLayoutEffect(() => {
    if (ref.current && size.height > 0) {
      const adjustedHeight = Math.max(size.height + 24, 100);
      setSize(index, adjustedHeight);
    }
  }, [settings.showTransliteration, settings.showTranslation, index, setSize, size.height, ref]);

  if (!verse) {
    return (
      <div style={style}>
        <VerseSkeleton />
      </div>
    );
  }

  return (
    <div style={style}>
      <div ref={ref} className="verse-item-container">
        <ClickableVerseContainer
          surah={verse.surahId}
          verse={verse.numberInSurah}
          className="glass-morphism p-6 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 transform hover:scale-[1.005] border border-white/10 hover:border-gold/40 mb-4"
          showPlayButton={true}
          playButtonPosition="top-right"
        >
          <div className="space-y-4">
            {/* Verse Number and Bookmark */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gradient-gold font-bold text-2xl">
                {verse.surahId}:{verse.numberInSurah}
              </span>
              <BookmarkHeart
                surahId={verse.surahId}
                verseNumber={verse.numberInSurah}
                verseText={verse.text}
                surahName={surahName || `Surah ${verse.surahId}`}
                translation={verse.translation || ''}
                className="ml-2"
              />
            </div>

            {/* Arabic Text */}
            <div className="text-center">
              <p
                className="text-3xl md:text-4xl lg:text-5xl leading-relaxed font-arabic text-white"
                style={{ fontFamily: 'var(--font-amiri)' }}
                dir="rtl"
              >
                {verse.text}
              </p>
            </div>

            {/* Transliteration */}
            {settings.showTransliteration && verse.transliteration && (
              <div className="text-center border-t border-white/10 pt-4">
                <TransliterationDisplay
                  transliteration={verse.transliteration}
                  size="medium"
                  showLabel={true}
                  className="text-gold/80 italic"
                />
              </div>
            )}

            {/* Translation */}
            {settings.showTranslation && verse.translation && (
              <div className="text-center border-t border-white/10 pt-4">
                <p className="text-gray-100 text-base md:text-lg leading-relaxed">
                  {verse.translation}
                </p>
              </div>
            )}
          </div>
        </ClickableVerseContainer>
      </div>
    </div>
  );
}, areEqual);

VerseItem.displayName = 'VerseItem';

export default VerseItem;