'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Types for API response
interface SurahMetadata {
  number: number;
  name: string; // Arabic name
  ename: string; // English name
  tname: string; // Transliterated name
  ayas: number; // Number of verses
  type: string; // Meccan/Medinan
}

// Types for verses
interface VerseData {
  id: number;
  text: string; // Arabic text
  numberInSurah: number;
  juz: number;
  hizbQuarter: number;
  sajda: boolean;
  translation?: string; // English translation
  transliteration?: string; // Transliteration
}

// Modal view type
type ModalView = 'list' | 'detail';

interface SurahListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom hook for fetching surahs
const useSurahs = () => {
  const [surahs, setSurahs] = useState<SurahMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSurahs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/get-metadata?type=surah-list');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch surahs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Surahs API response:', data);
      
      // The API returns surahs in data.defaultData.surahs structure
      const surahsData = data.defaultData?.surahs || data.surahs || data.chapters || data;
      
      if (Array.isArray(surahsData)) {
        setSurahs(surahsData);
      } else {
        throw new Error('Invalid surahs data structure');
      }
      
    } catch (err) {
      console.error('Error fetching surahs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load surahs');
      
      // Fallback data for demonstration
      setSurahs([
        { number: 1, ename: "Al-Fatihah", name: "الفاتحة", tname: "Al-Faatiha", ayas: 7, type: "Meccan" },
        { number: 2, ename: "Al-Baqarah", name: "البقرة", tname: "Al-Baqara", ayas: 286, type: "Medinan" },
        { number: 3, ename: "Ali 'Imran", name: "آل عمران", tname: "Aal-i-Imraan", ayas: 200, type: "Medinan" },
        { number: 4, ename: "An-Nisa", name: "النساء", tname: "An-Nisaa", ayas: 176, type: "Medinan" },
        { number: 5, ename: "Al-Ma'idah", name: "المائدة", tname: "Al-Maaida", ayas: 120, type: "Medinan" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurahs();
  }, []);

  return { surahs, loading, error, refetch: fetchSurahs };
};

// Custom hook for fetching verses
const useVerses = (surahNumber: number | null) => {
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerses = async (surahNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch verses with translation in a single call
      const versesResponse = await fetch(`https://luminous-verses-api-tan.vercel.app/api/v1/get-verses?surah=${surahNum}&translation=true`);
      
      if (!versesResponse.ok) {
        throw new Error(`Failed to fetch verses: ${versesResponse.status}`);
      }
      
      const versesData = await versesResponse.json();
      console.log('Verses API response:', versesData);
      
      if (Array.isArray(versesData)) {
        // Add manual translations for common surahs as fallback
        const versesWithTranslations = versesData.map((verse) => {
          let translation = verse.translation;
          
          // Fallback translations for Surah Al-Fatiha (Surah 1)
          if (surahNum === 1) {
            const fatihaTranslations: { [key: number]: string } = {
              1: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
              2: "[All] praise is [due] to Allah, Lord of the worlds -",
              3: "The Entirely Merciful, the Especially Merciful,",
              4: "Sovereign of the Day of Recompense.",
              5: "It is You we worship and You we ask for help.",
              6: "Guide us to the straight path -",
              7: "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray."
            };
            translation = translation || fatihaTranslations[verse.numberInSurah];
          }
          
          // Fallback translations for Surah Adh-Dhariyat (Surah 51) - popular verses
          if (surahNum === 51) {
            const dhariyatTranslations: { [key: number]: string } = {
              56: "And I did not create the jinn and mankind except to worship Me."
            };
            translation = translation || dhariyatTranslations[verse.numberInSurah];
          }
          
          return {
            ...verse,
            translation
          };
        });
        
        setVerses(versesWithTranslations);
      } else {
        throw new Error('Invalid verses data structure');
      }
      
    } catch (err) {
      console.error('Error fetching verses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (surahNumber) {
      fetchVerses(surahNumber);
    }
  }, [surahNumber]);

  return { verses, loading, error, refetch: () => surahNumber && fetchVerses(surahNumber) };
};

// Individual Verse Item Component
const VerseItem = ({ verse, surahName }: { verse: VerseData; surahName: string }) => {
  return (
    <div className="group glass-morphism p-6 rounded-xl border border-white/10 hover:border-gold/40 transition-all duration-300">
      {/* Verse Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
            {verse.numberInSurah}
          </div>
          <span className="text-gold/80 text-sm">{surahName} - Verse {verse.numberInSurah}</span>
        </div>
        {verse.sajda && (
          <div className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
            <span className="text-purple-300 text-xs font-medium">SAJDA</span>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Arabic Text */}
      <div className="text-center mb-6">
        <p className="text-white text-2xl md:text-3xl lg:text-4xl leading-relaxed font-[family-name:var(--font-amiri)] mb-6" dir="rtl">
          {verse.text}
        </p>
        
        {/* English Translation */}
        {verse.translation && (
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/90 text-lg md:text-xl leading-relaxed font-medium italic" dir="ltr">
              &ldquo;{verse.translation}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <button className="group flex items-center gap-2 glass-morphism px-4 py-2 rounded-full hover:bg-gold/20 transition-all duration-300">
          <svg className="w-4 h-4 text-gold group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span className="text-white text-sm font-medium">Listen</span>
        </button>
        
        <button className="group flex items-center gap-2 glass-morphism px-4 py-2 rounded-full hover:bg-purple-500/20 transition-all duration-300">
          <svg className="w-4 h-4 text-purple-300 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <span className="text-white text-sm font-medium">Save</span>
        </button>

        <button className="group flex items-center gap-2 glass-morphism px-4 py-2 rounded-full hover:bg-blue-500/20 transition-all duration-300">
          <svg className="w-4 h-4 text-blue-300 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="text-white text-sm font-medium">Share</span>
        </button>
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/60">
        <span>Juz {verse.juz}</span>
        <span>Hizb Quarter {verse.hizbQuarter}</span>
      </div>
    </div>
  );
};

// Individual Surah Item Component
const SurahItem = ({ surah, onClick }: { surah: SurahMetadata; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left glass-morphism p-4 rounded-xl hover:bg-gradient-to-r hover:from-gold/20 hover:to-purple-500/20 transition-all duration-300 transform hover:scale-[1.02] border border-white/10 hover:border-gold/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
              {surah.number}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{surah.ename}</h3>
              <p className="text-gold/80 text-sm">{surah.type} • {surah.ayas} verses</p>
            </div>
          </div>
          <p className="text-right font-[family-name:var(--font-amiri)] text-gold text-xl">
            {surah.name}
          </p>
        </div>
        <svg 
          className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform duration-300" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  );
};

// Main Modal Component
const SurahListModal = ({ isOpen, onClose }: SurahListModalProps) => {
  const { surahs, loading, error, refetch } = useSurahs();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  // Modal navigation state
  const [currentView, setCurrentView] = useState<ModalView>('list');
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);
  
  // Fetch verses when a surah is selected
  const { verses, loading: versesLoading, error: versesError, refetch: refetchVerses } = useVerses(selectedSurah?.number || null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      previouslyFocusedElement.current?.focus();
      
      // Reset modal state when closed
      setCurrentView('list');
      setSelectedSurah(null);
    }

    return () => {
      document.body.style.overflow = '';
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (currentView === 'detail') {
        // Go back to list view on Escape in detail view
        setCurrentView('list');
        setSelectedSurah(null);
      } else {
        // Close modal on Escape in list view
        onClose();
      }
    }
  };

  const handleSurahClick = (surah: SurahMetadata) => {
    console.log('Selected surah:', surah);
    setSelectedSurah(surah);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSurah(null);
  };

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] glass-morphism-dark rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative z-10 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentView === 'detail' && selectedSurah && (
                  <button
                    onClick={handleBackToList}
                    className="group p-2 rounded-full glass-morphism hover:bg-gold/20 transition-all duration-300"
                    aria-label="Back to surah list"
                  >
                    <svg className="w-5 h-5 text-gold group-hover:-translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <div>
                  {currentView === 'list' ? (
                    <>
                      <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-gradient-gold">
                        ✨ Choose a Surah ✨
                      </h2>
                      <p className="text-white/70 mt-1">Select a chapter to explore its beautiful verses</p>
                    </>
                  ) : selectedSurah ? (
                    <>
                      <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-gradient-gold">
                        {selectedSurah.ename}
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-white/70 font-[family-name:var(--font-amiri)] text-lg">
                          {selectedSurah.name}
                        </p>
                        <span className="text-gold/80 text-sm">
                          {selectedSurah.type} • {selectedSurah.ayas} verses
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <button
                onClick={onClose}
                className="group p-2 rounded-full glass-morphism hover:bg-red-500/20 transition-all duration-300"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-white group-hover:text-red-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {currentView === 'list' && (
              <>
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/30 border-t-gold mb-4"></div>
                    <p className="text-white/70 text-lg">Loading Surahs...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-12">
                    <div className="text-red-400 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg">{error}</p>
                    </div>
                    <button
                      onClick={refetch}
                      className="glass-morphism px-6 py-3 rounded-full text-gold hover:bg-gold/20 transition-all duration-300"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!loading && !error && surahs.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    {surahs.map((surah) => (
                      <SurahItem
                        key={surah.number}
                        surah={surah}
                        onClick={() => handleSurahClick(surah)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {currentView === 'detail' && selectedSurah && (
              <>
                {versesLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/30 border-t-gold mb-4"></div>
                    <p className="text-white/70 text-lg">Loading verses...</p>
                  </div>
                )}

                {versesError && (
                  <div className="text-center py-12">
                    <div className="text-red-400 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg">{versesError}</p>
                    </div>
                    <button
                      onClick={refetchVerses}
                      className="glass-morphism px-6 py-3 rounded-full text-gold hover:bg-gold/20 transition-all duration-300"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!versesLoading && !versesError && verses.length > 0 && (
                  <div className="space-y-6">
                    {verses.map((verse) => (
                      <VerseItem
                        key={verse.id}
                        verse={verse}
                        surahName={selectedSurah.ename}
                      />
                    ))}
                  </div>
                )}

                {!versesLoading && !versesError && verses.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-white/70 text-lg">No verses found for this surah.</p>
                    <button
                      onClick={handleBackToList}
                      className="glass-morphism px-6 py-3 rounded-full text-gold hover:bg-gold/20 transition-all duration-300 mt-4"
                    >
                      Back to Surahs
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"></div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default SurahListModal;