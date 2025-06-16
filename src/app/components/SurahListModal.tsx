'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

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

// Add at the top of the file, after imports
const HEADER_MAX_HEIGHT = 160; // px, adjust as needed for your header

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
      className="group w-full text-left glass-morphism p-4 rounded-xl transition-all duration-300 border border-white/10"
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
          className="w-5 h-5 text-purple-300 transition-transform duration-300" 
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
  const headerRef = useRef<HTMLDivElement>(null); // Ref for the header to measure its height

  // Modal navigation state
  const [currentView, setCurrentView] = useState<ModalView>('list');
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  // Header fade state
  const [headerOpacity, setHeaderOpacity] = useState(1);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for Jump to Verse modal and target
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpTargetVerse, setJumpTargetVerse] = useState<number | null>(null);

  // Handler for verse list scroll
  const handleVerseListScroll = useCallback((scrollTop: number) => {
    // Fade out header as user scrolls down (0px = fully visible, >=100px = fully faded)
    const fadeStart = 0;
    const fadeEnd = 100;
    const opacity = scrollTop <= fadeStart
      ? 1
      : scrollTop >= fadeEnd
      ? 0
      : 1 - (scrollTop - fadeStart) / (fadeEnd - fadeStart);
    setHeaderOpacity(opacity);
  }, []);

  // Modal open/close logic

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

  // Filter surahs by search query (English, Arabic, transliterated, number)
  const filteredSurahs = surahs.filter((surah) => {
    const query = searchQuery.toLowerCase();
    return (
      surah.name.toLowerCase().includes(query) ||
      surah.ename.toLowerCase().includes(query) ||
      surah.tname.toLowerCase().includes(query) ||
      surah.number.toString().includes(query)
    );
  });

  // Handler for Jump to Verse
  const handleJumpToVerse = (verseNumber: number) => {
    setJumpTargetVerse(verseNumber);
    setIsJumpModalOpen(false);
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
      
      {/* Container for Modal and Back Button */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        {/* Back Button - positioned outside and to the left of the modal */}
        {currentView === 'detail' && selectedSurah && (
          <button
            onClick={handleBackToList}
            className="absolute top-1/2 -translate-y-1/2 left-4 z-50 w-12 h-12 rounded-full glass-morphism opacity-30 focus:opacity-100 bg-gray-500/20 focus:bg-gold/20 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-gold/20 pointer-events-auto"
            aria-label="Back to surah list"
          >
            <svg 
              className="w-6 h-6 text-gray-400 focus:text-gold transition-all duration-300 mx-auto" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          ref={modalRef}
          onKeyDown={handleKeyDown}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-4xl h-[90vh] glass-morphism-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        >
          
          {/* Search Input: only show on Surah list view */}
          {currentView === 'list' && (
            <div className="px-6 pt-6 pb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Surahs..."
                aria-label="Search Surahs"
                className="w-full rounded-lg border border-gold-900/30 bg-desert-night/80 px-4 py-2 text-base text-gold-100/90 focus:outline-none focus:ring-2 focus:ring-gold-500 transition"
              />
            </div>
          )}

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

                {!loading && !error && filteredSurahs.length === 0 ? (
                  <div className="text-center text-gold-200/70 py-8">No Surahs found.</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                    {filteredSurahs.map((surah) => (
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
                <div 
                  ref={headerRef} // Assign ref to header
                  className="sticky top-0 left-0 w-full border-b border-white/10 z-20 bg-desert-night/90 backdrop-blur-sm"
                  style={{
                    opacity: headerOpacity,
                    maxHeight: `${headerOpacity === 0 ? 0 : HEADER_MAX_HEIGHT}px`,
                    transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                    overflow: 'hidden',
                    pointerEvents: headerOpacity === 0 ? 'none' : undefined,
                  }}
                >
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
                {/* Jump to Verse Button (only if more than 10 verses) */}
                {selectedSurah.ayas > 10 && (
                  <div className="px-6 pt-4 pb-2 flex justify-end">
                    <button
                      className="glass-morphism px-4 py-2 rounded-lg text-gold font-semibold hover:bg-gold/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold"
                      onClick={() => setIsJumpModalOpen(true)}
                      aria-label="Jump to verse"
                    >
                      Jump to Verse
                    </button>
                  </div>
                )}
                {/* Scrollable Verse List Container */}
                <div 
                  className="flex-grow overflow-y-auto relative"
                >
                  <VerseListContainer
                    selectedSurah={selectedSurah}
                    onScroll={handleVerseListScroll}
                    scrollToVerse={jumpTargetVerse}
                    onScrolledToVerse={() => setJumpTargetVerse(null)}
                  />
                </div>
                {/* Jump to Verse Modal */}
                {isJumpModalOpen && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-desert-night rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gold focus:outline-none"
                        onClick={() => setIsJumpModalOpen(false)}
                        aria-label="Close jump to verse modal"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <h3 className="text-xl font-bold text-gold mb-4 text-center">Jump to Verse</h3>
                      <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
                        {Array.from({ length: selectedSurah.ayas }, (_, i) => (
                          <button
                            key={i + 1}
                            className="bg-gold/10 hover:bg-gold/30 text-gold font-semibold rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-150"
                            onClick={() => handleJumpToVerse(i + 1)}
                            aria-label={`Jump to verse ${i + 1}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
}