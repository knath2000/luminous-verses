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
    }

    return () => {
      document.body.style.overflow = '';
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSurahClick = (surah: SurahMetadata) => {
    console.log('Selected surah:', surah);
    // TODO: Navigate to surah page
    onClose();
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
              <div>
                <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-gradient-gold">
                  ✨ Choose a Surah ✨
                </h2>
                <p className="text-white/70 mt-1">Select a chapter to explore its beautiful verses</p>
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