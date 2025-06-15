'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic'; // Import dynamic from next/dynamic

import SurahDescriptionHeader from './SurahDescriptionHeader';
import {
  fetchSurahs,
  SurahMetadata
} from '../utils/quranApi';

// Dynamically import VerseListContainer with ssr: false
const VerseListContainer = dynamic(() => import('./VerseListContainer'), { 
  ssr: false,
  loading: () => (
    <div className="flex-grow overflow-hidden h-full flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold/30 border-t-gold mb-4"></div>
      <p className="text-white/70 text-lg mt-4">Loading verses...</p>
    </div>
  ),
});


// Modal view type
type ModalView = 'list' | 'detail';

interface SurahListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom hook for fetching surahs using the new API
const useSurahs = () => {
  const [surahs, setSurahs] = useState<SurahMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSurahs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const surahsData = await fetchSurahs();
      setSurahs(surahsData);
      
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
    loadSurahs();
  }, []);

  return { surahs, loading, error, refetch: loadSurahs };
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
export function SurahListModal({ isOpen, onClose }: SurahListModalProps) { // Export the component
  const { surahs, loading, error, refetch } = useSurahs();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  // Modal navigation state
  const [currentView, setCurrentView] = useState<ModalView>('list');
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  // Modal open/close logic
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previouslyFocusedElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
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
    setIsDescriptionExpanded(false); // Start with description collapsed
  };

  const handleBackToList = () => {
    console.log('Back to list clicked');
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
        onClick={onClose}
        className="fixed inset-0 flex items-center justify-center p-4"
      >
        <div 
          className="relative w-full max-w-4xl h-[90vh] glass-morphism-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Content */}
          <div className="relative z-10 flex flex-col flex-grow h-full">
            {currentView === 'list' && (
              <div className="p-6 overflow-y-auto h-full">
                {/* Title for List View */}
                <div className="text-center mb-8">
                  <h2 id="modal-title" className="text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
                    ✨ Choose a Surah ✨
                  </h2>
                  <p className="text-white/70 text-lg">Select a chapter to explore its beautiful verses</p>
                </div>

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
              </div>
            )}

            {currentView === 'detail' && selectedSurah && (
              <div className="flex flex-col h-full">
                {/* Fixed Header Section */}
                <div className="p-6 pb-4 border-b border-white/10">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold mb-2">
                      {selectedSurah.ename}
                    </h2>
                    <div className="flex items-center justify-center gap-4">
                      <p className="text-white/70 font-[family-name:var(--font-amiri)] text-lg">
                        {selectedSurah.name}
                      </p>
                      <span className="text-gold/80 text-sm">
                        {selectedSurah.type} • {selectedSurah.ayas} verses
                      </span>
                    </div>
                  </div>

                  {/* Surah Description Header */}
                  <SurahDescriptionHeader
                    surah={{
                      number: selectedSurah.number,
                      name: selectedSurah.name,
                      englishName: selectedSurah.ename,
                      englishNameTranslation: selectedSurah.tname,
                      numberOfAyahs: selectedSurah.ayas,
                      revelationType: selectedSurah.type
                    }}
                    isExpanded={isDescriptionExpanded}
                    onToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  />
                </div>

                {/* Scrollable Verse List Container */}
                <div className="flex-grow overflow-hidden">
                  <VerseListContainer selectedSurah={selectedSurah} />
                </div>
              </div>
            )}
          </div>

          {/* Floating Back Button - positioned halfway down the modal */}
          {currentView === 'detail' && selectedSurah && (
            <button
              onClick={handleBackToList}
              className="fixed left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full glass-morphism opacity-30 hover:opacity-100 focus:opacity-100 bg-gray-500/20 hover:bg-gold/20 focus:bg-gold/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/20 focus:shadow-xl focus:shadow-gold/20 group"
              aria-label="Back to surah list"
            >
              <svg 
                className="w-6 h-6 text-gray-400 group-hover:text-gold group-focus:text-gold group-hover:-translate-x-1 group-focus:-translate-x-1 transition-all duration-300 mx-auto" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"></div>
        </div>
      </div>
    </div>,
    modalRoot
  );
}