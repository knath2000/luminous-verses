import React, { memo, useLayoutEffect, useCallback } from 'react';
import { areEqual } from 'react-window';
import { ClickableVerseContainer } from './ClickableVerseContainer';
import useResizeObserver from '../hooks/useResizeObserver';
import VerseSkeleton from './VerseSkeleton';
import { BookmarkHeart } from './BookmarkHeart';
import ExpandableText from './ExpandableText';

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
    surahNames: Map<number, string>; // Add surahNames to data
  };
}

const VerseItem = memo<VerseItemProps>(({ index, style, data }) => {
  const { verses, setSize, settings, surahNames } = data;
  const verse = verses[index];

  const surahName = surahNames.get(verse?.surahId) || `Surah ${verse?.surahId}`;

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
                surahName={surahName}
                translation={verse.translation || ''}
                className="ml-2"
              />
            </div>

            {/* Arabic Text */}
            <div className="text-center">
              <ExpandableText
                text={verse.text}
                maxLines={3} // Limit Arabic text to 3 lines
                dir="rtl"
                lang="ar"
                className="text-3xl md:text-4xl lg:text-5xl leading-relaxed font-arabic text-white"
                onHeightChange={() => setSize(index, ref.current?.offsetHeight || 0)} // Update size on toggle
              />
            </div>

            {/* Transliteration */}
            {settings.showTransliteration && verse.transliteration && (
              <div className="text-center border-t border-white/10 pt-4">
                <ExpandableText
                  text={verse.transliteration}
                  maxLines={3} // Limit transliteration to 3 lines
                  dir="ltr"
                  lang="en"
                  className="text-gold/80 italic text-base md:text-lg"
                  onHeightChange={() => setSize(index, ref.current?.offsetHeight || 0)} // Update size on toggle
                />
              </div>
            )}

            {/* Translation */}
            {settings.showTranslation && verse.translation && (
              <div className="text-center border-t border-white/10 pt-4">
                <ExpandableText
                  text={verse.translation}
                  maxLines={4} // Limit translation to 4 lines
                  dir="ltr"
                  lang="en"
                  className="text-gray-100 text-base md:text-lg leading-relaxed"
                  onHeightChange={() => setSize(index, ref.current?.offsetHeight || 0)} // Update size on toggle
                />
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