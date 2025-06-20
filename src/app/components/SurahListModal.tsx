'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import SurahDescriptionHeader from './SurahDescriptionHeader';
import {
  fetchSurahs,
  SurahMetadata
} from '../utils/quranApi';
import { useScrollPreservation } from '../hooks/useScrollPreservation';
import { JumpToVerseModal } from './navigation/JumpToVerseModal';
import { VERSE_NAVIGATION_THRESHOLD } from '../constants/navigation';

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

// Import the type for the VerseListContainer handle
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { VerseListContainerHandle } from './VerseListContainer';

// Add at the top of the file, after imports
const HEADER_MAX_HEIGHT = 160; // px, adjust as needed for your header

// Modal view type
type ModalView = 'list' | 'detail';

// Query-string key we'll use to encode the modal view in the URL
const VIEW_QUERY_PARAM = 'view';

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [restorationState, setRestorationState] = useState<'idle' | 'pending' | 'restoring' | 'complete'>('idle');

  // Header fade state
  const [headerOpacity, setHeaderOpacity] = useState(1);

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Add state for Jump to Verse modal and target
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpTargetVerse, setJumpTargetVerse] = useState<number | null>(null);

  // Initialize scroll preservation
  const {
    scrollState,
    surahListScrollRef,
    verseListRef,
    saveSurahListPosition,
    saveVerseListPosition,
    restoreSurahListPosition,
    restoreVerseListPosition,
    persistWithLastActiveView,
  } = useScrollPreservation();

  // Query-string key we'll use to encode the modal view in the URL
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Utility to push/replace URL with the desired view param (shallow, no scroll)
  const updateUrlViewParam = useCallback(
    (view: ModalView, replace = false) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (view === 'list') {
        params.delete(VIEW_QUERY_PARAM);
      } else {
        params.set(VIEW_QUERY_PARAM, 'detail');
      }
      const url = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  /* ────────────────────────────────────────────────
     Listen for browser back/forward (popstate) and
     synchronise sessionStorage so restoration effect
     stays consistent with the URL.
  ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get(VIEW_QUERY_PARAM) !== 'detail') {
        sessionStorage.setItem('lv_lastActiveView', 'list');
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Handler for verse list scroll
  const handleVerseListScroll = useCallback((scrollTop: number, visibleIndex?: number) => {
    // Fade out header as user scrolls down (0px = fully visible, >=100px = fully faded)
    const fadeStart = 0;
    const fadeEnd = 100;
    const opacity = scrollTop <= fadeStart
      ? 1
      : scrollTop >= fadeEnd
      ? 0
      : 1 - (scrollTop - fadeStart) / (fadeEnd - fadeStart);
    setHeaderOpacity(opacity);

    // Save verse list scroll position if we have a selected surah
    if (selectedSurah && visibleIndex !== undefined && restorationState !== 'restoring') {
      saveVerseListPosition(scrollTop, visibleIndex, selectedSurah.number);
    }
  }, [selectedSurah, saveVerseListPosition, restorationState]);

  // Modal open/close logic

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (currentView === 'detail') {
        // Go back to list view on Escape in detail view
        handleBackToList();
      } else {
        // Close modal on Escape in list view
        handleModalClose();
      }
    }
  };

  // Close the modal and reset navigation state so the next open always starts on the list view
  const handleModalClose = useCallback(() => {
    // 1️⃣ Replace the query param so ?view=detail is cleared without adding a history entry
    updateUrlViewParam('list', true);

    // 2️⃣ Persist that the last active view when closing was the list
    persistWithLastActiveView('list');

    onClose();
  }, [updateUrlViewParam, persistWithLastActiveView, onClose]);

  const handleSurahClick = (surah: SurahMetadata) => {
    setSelectedSurah(surah);
    setCurrentView('detail');
    updateUrlViewParam('detail');
    setIsDescriptionExpanded(false); // Start with description collapsed
  };

  const handleBackToList = useCallback(() => {
    // Note: verse scroll position is already saved via real-time tracking
    setCurrentView('list');
    setSelectedSurah(null);
    updateUrlViewParam('list');
    setRestorationState('pending'); // Prepare to restore surah list
  }, [updateUrlViewParam]);

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

  // --- STATE MACHINE FOR SCROLL RESTORATION ---

  // 1. Trigger restoration when the modal is opened or the view changes back to the list
  useEffect(() => {
    if (isOpen) {
      setRestorationState('pending');
    } else {
      setRestorationState('idle'); // Reset when modal closes
    }
  }, [isOpen]);

  // 2. Execute the restoration based on the current view and state
  useEffect(() => {
    if (restorationState !== 'pending' || !isOpen || loading || surahs.length === 0) return;

    const urlView = searchParams?.get(VIEW_QUERY_PARAM);

    console.log('🔄 Restoration logic - currentView:', currentView, 'lastActiveView:', scrollState.lastActiveView, 'selectedSurahNumber:', scrollState.selectedSurahNumber, 'urlView:', urlView);

    // A. Restore Surah List (URL says list or lastActiveView not detail)
    if (currentView === 'list' && (urlView !== 'detail' || scrollState.lastActiveView !== 'detail')) {
      console.log('🔄 Restoring surah list view');
      setRestorationState('restoring');
      restoreSurahListPosition().then(() => {
        setRestorationState('complete');
      });
    }

    // B. Restore Verse Detail view only if URL also wants detail
    else if (currentView === 'list' && urlView === 'detail' && scrollState.lastActiveView === 'detail' && scrollState.selectedSurahNumber) {
      const lastSurah = surahs.find(s => s.number === scrollState.selectedSurahNumber);
      if (lastSurah) {
        console.log('🔄 Restoring detail view for surah:', lastSurah.ename);
        setRestorationState('restoring');
        // This part just sets the view, the next effect handles the actual scroll
        setSelectedSurah(lastSurah);
        setCurrentView('detail');
      } else {
        console.log('🔄 Cannot find surah for restoration, aborting');
        setRestorationState('idle'); // Cannot find surah, abort
      }
    } else {
      // Any other pending state is considered complete for this effect
      console.log('🔄 Restoration complete - no action needed');
      setRestorationState('complete');
    }
    
  }, [restorationState, isOpen, loading, currentView, surahs, scrollState.lastActiveView, scrollState.selectedSurahNumber, restoreSurahListPosition, searchParams]);

  // 3. Specifically handle scrolling to a verse AFTER the detail view is rendered
  useEffect(() => {
    if (currentView === 'detail' && selectedSurah && restorationState === 'restoring') {
      console.log('🔄 Restoring verse scroll for surah:', selectedSurah.ename, 'to position:', scrollState.verseScrollPosition, 'index:', scrollState.verseScrollIndex);
      restoreVerseListPosition(selectedSurah.number).then(() => {
        console.log('🔄 Verse scroll restoration complete');
        setRestorationState('complete');
      });
    }
  }, [currentView, selectedSurah, restorationState, restoreVerseListPosition, scrollState.verseScrollPosition, scrollState.verseScrollIndex]);

  /* ── Initial view sync from URL on open ────────────── */
  useEffect(() => {
    if (!isOpen) return;

    // read once on open – keeps existing restoration logic intact
    const initialView = searchParams?.get(VIEW_QUERY_PARAM);
    if (initialView === 'detail' && currentView === 'list') {
      // We don't know which surah yet; restoration logic will pick the last one
      setCurrentView('detail');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleModalClose}
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
              <div 
                ref={surahListScrollRef}
                className="p-6 overflow-y-auto h-full"
                onScroll={saveSurahListPosition}
              >
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
                {/* Jump to Verse Button (only if more than threshold verses) */}
                {selectedSurah.ayas > VERSE_NAVIGATION_THRESHOLD && (
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
                    ref={verseListRef}
                    selectedSurah={selectedSurah}
                    onScroll={handleVerseListScroll}
                    scrollToVerse={jumpTargetVerse}
                    onScrolledToVerse={() => setJumpTargetVerse(null)}
                  />
                </div>
                {/* Improved Jump to Verse Modal */}
                <JumpToVerseModal
                  isOpen={isJumpModalOpen}
                  onClose={() => setIsJumpModalOpen(false)}
                  onVerseSelect={handleJumpToVerse}
                  totalVerses={selectedSurah.ayas}
                  currentVerse={jumpTargetVerse || undefined}
                  surahName={selectedSurah.ename}
                  isLoading={false}
                />
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