'use client';

import { useEffect, useState, useCallback } from 'react';
import SurahListModal from './components/SurahListModal';

// Types for API response
interface VerseData {
  arabic: string;
  translation: string;
  surah: number;
  verse: number;
  surahName: string;
  surahNameArabic: string;
}



// Stars component for background
const Stars = () => {
  const [stars, setStars] = useState<Array<{ id: number; top: string; left: string; delay: number }>>([]);

  useEffect(() => {
    const generateStars = () => {
      const starArray = [];
      for (let i = 0; i < 50; i++) {
        starArray.push({
          id: i,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          delay: Math.random() * 3,
        });
      }
      setStars(starArray);
    };
    generateStars();
  }, []);

  return (
    <div className="stars fixed inset-0 w-full h-full pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star absolute w-1 h-1 bg-white rounded-full opacity-70"
          style={{
            top: star.top,
            left: star.left,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Floating orbs for ambient effect
const FloatingOrbs = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute top-40 right-20 w-24 h-24 rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute bottom-32 left-1/4 w-20 h-20 rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
          animation: 'float 7s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
    </div>
  );
};

// Verse of the Day Component
const VerseOfTheDay = ({ onOpenQuran }: { onOpenQuran: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get a random verse
  const getRandomVerse = () => {
    // Popular verses for "verse of the day" - using well-known verses
    const popularVerses = [
      { surah: 1, verse: 1 }, // Al-Fatiha
      { surah: 2, verse: 255 }, // Ayat al-Kursi
      { surah: 51, verse: 56 }, // Purpose of creation
      { surah: 94, verse: 5 }, // With hardship comes ease
      { surah: 13, verse: 28 }, // Hearts find rest in remembrance
      { surah: 17, verse: 110 }, // Say: Call upon Allah
      { surah: 25, verse: 74 }, // Grant us comfort in our families
      { surah: 39, verse: 53 }, // Do not despair of Allah's mercy
    ];
    
    return popularVerses[Math.floor(Math.random() * popularVerses.length)];
  };

  // Fetch verse data from API
  const fetchVerseData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const randomVerse = getRandomVerse();
      
      // Try the get-verses endpoint instead
      const verseResponse = await fetch(
        `https://luminous-verses-api-tan.vercel.app/api/v1/get-verses?surah=${randomVerse.surah}&start=${randomVerse.verse}&end=${randomVerse.verse}`
      );
      
      if (!verseResponse.ok) {
        console.error('Verse API response status:', verseResponse.status);
        const errorText = await verseResponse.text();
        console.error('Verse API error response:', errorText);
        throw new Error(`Failed to fetch verse data: ${verseResponse.status}`);
      }
      
      const verseResult = await verseResponse.json();
      console.log('Verse API response:', verseResult);
      
      // Check if we have data - API returns verses directly as an array
      if (!verseResult || !Array.isArray(verseResult) || verseResult.length === 0) {
        throw new Error('No verse data received from API');
      }
      
      // Find the specific verse we requested
      const verse = verseResult.find((v: { numberInSurah: number }) => v.numberInSurah === randomVerse.verse) || verseResult[0];
      
      // Get Surah metadata for names
      let surahInfo = { name_simple: `Surah ${randomVerse.surah}`, name_arabic: "" };
      try {
        const metadataResponse = await fetch(
          `https://luminous-verses-api-tan.vercel.app/api/v1/get-metadata`
        );
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          const surahMeta = metadata.surahs?.find((s: { id: number }) => s.id === randomVerse.surah);
          if (surahMeta) {
            surahInfo = surahMeta;
          }
        }
      } catch (metaError) {
        console.warn('Could not fetch metadata:', metaError);
      }
      
      // Get English translation from our curated collection
      const getTranslation = (surah: number, verse: number): string => {
        const translations: { [key: string]: string } = {
          "1:1": "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
          "2:255": "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
          "51:56": "And I did not create the jinn and mankind except to worship Me.",
          "94:5": "For indeed, with hardship [will be] ease.",
          "94:6": "Indeed, with hardship [will be] ease.",
          "13:28": "Unquestionably, by the remembrance of Allah hearts are assured.",
          "17:110": "Say, 'Call upon Allah or call upon the Most Merciful. Whichever [name] you call - to Him belong the best names.'",
          "25:74": "And those who say, 'Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.'",
          "39:53": "Say, 'O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah.'",
        };
        
        const key = `${surah}:${verse}`;
        return translations[key] || "Beautiful verse from the Quran - English translation coming soon.";
      };

      const translation = getTranslation(randomVerse.surah, randomVerse.verse);
      
      setVerseData({
        arabic: verse.text || "Arabic text not available",
        translation: translation,
        surah: randomVerse.surah,
        verse: randomVerse.verse,
        surahName: surahInfo.name_simple || `Surah ${randomVerse.surah}`,
        surahNameArabic: surahInfo.name_arabic || "",
      });
      
    } catch (err) {
      console.error('Error fetching verse:', err);
      setError('Failed to load verse. Please try again later.');
      
      // Fallback to default verse
      setVerseData({
        arabic: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
        translation: "And I did not create the jinn and mankind except to worship Me.",
        surah: 51,
        verse: 56,
        surahName: "Adh-Dhariyat",
        surahNameArabic: "الذاريات",
      });
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since the function doesn't depend on any props or state

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    fetchVerseData();
    return () => clearTimeout(timer);
  }, [fetchVerseData]);

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold mb-2">
            ✨ Verse of the Day ✨
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto rounded-full"></div>
        </div>
        
        <div className="glass-morphism-dark rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-white/10 rounded-lg"></div>
            <div className="h-6 bg-white/10 rounded-lg w-3/4 mx-auto"></div>
            <div className="h-8 bg-white/10 rounded-lg w-5/6 mx-auto"></div>
            <div className="h-4 bg-white/10 rounded-lg w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !verseData) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="glass-morphism-dark rounded-3xl p-6 md:p-8 shadow-2xl text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg">{error}</p>
          </div>
          <button
            onClick={fetchVerseData}
            className="glass-morphism px-6 py-3 rounded-full text-gold hover:bg-gold/20 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!verseData) return null;

  return (
    <div 
      className={`w-full max-w-4xl mx-auto transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      {/* Card Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold mb-2">
          ✨ Verse of the Day ✨
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto rounded-full"></div>
      </div>

      {/* Main Verse Card */}
      <div className="glass-morphism-dark rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/20 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl"></div>
        
        {/* Arabic Text */}
        <div className="relative z-10 space-y-6">
          <div className="text-center">
            <p className="arabic-text text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-relaxed mb-4 font-[family-name:var(--font-amiri)]">
              {verseData.arabic}
            </p>
          </div>


          {/* Translation */}
          <div className="text-center">
            <p className="text-white/90 text-base md:text-lg lg:text-xl leading-relaxed font-medium">
              &ldquo;{verseData.translation}&rdquo;
            </p>
          </div>

          {/* Reference */}
          <div className="text-center border-t border-white/20 pt-4">
            <p className="text-gold font-semibold text-sm md:text-base">
              {verseData.surahName} ({verseData.surah}:{verseData.verse})
            </p>
            {verseData.surahNameArabic && (
              <p className="text-gold/70 text-sm mt-1 font-[family-name:var(--font-amiri)]">
                {verseData.surahNameArabic}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button className="group flex items-center gap-3 glass-morphism px-6 py-3 rounded-full hover:bg-gold/20 transition-all duration-300 transform hover:scale-105">
              <svg className="w-5 h-5 text-gold group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-medium">Listen</span>
            </button>
            
            <button className="group flex items-center gap-3 glass-morphism px-6 py-3 rounded-full hover:bg-purple-500/20 transition-all duration-300 transform hover:scale-105">
              <svg className="w-5 h-5 text-purple-300 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              <span className="text-white font-medium">Save</span>
            </button>

            <button
              onClick={fetchVerseData}
              disabled={loading}
              className="group flex items-center gap-3 glass-morphism px-6 py-3 rounded-full hover:bg-emerald-500/20 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 text-emerald-300 ${loading ? 'animate-spin' : 'group-hover:animate-spin'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-medium">
                {loading ? 'Loading...' : 'New Verse'}
              </span>
            </button>

            <button className="group flex items-center gap-3 glass-morphism px-6 py-3 rounded-full hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105">
              <svg className="w-5 h-5 text-blue-300 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              <span className="text-white font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Open Quran Button - Separate section */}
        <div className="flex justify-center items-center pt-4 mt-2 border-t border-white/10">
          <button
            onClick={onOpenQuran}
            className="group flex items-center gap-4 glass-morphism px-8 py-4 rounded-2xl hover:bg-gradient-to-r hover:from-gold/20 hover:to-purple-500/20 transition-all duration-300 transform hover:scale-105 border-2 border-gold/30 hover:border-gold/60"
          >
            <svg className="w-6 h-6 text-gold group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 6h16M4 10h16M4 14h16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            <div className="text-left">
              <span className="text-white font-bold text-lg block">Open Quran</span>
              <span className="text-gold/80 text-sm">Explore more verses</span>
            </div>
            <svg className="w-5 h-5 text-purple-300 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gold/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none"></div>
      </div>

      {/* Bottom decoration */}
      <div className="text-center mt-6">
        <div className="inline-flex items-center gap-2 text-gold/70 text-sm">
          <span>🌙</span>
          <span>Reflecting on divine wisdom</span>
          <span>✨</span>
        </div>
      </div>
    </div>
  );
};

// Main Home Component
export default function Home() {
  const [titleVisible, setTitleVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenQuran = () => {
    console.log('Open Quran button clicked!'); // Debug log
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-desert-night relative overflow-hidden">
      {/* Background Elements */}
      <Stars />
      <FloatingOrbs />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4 px-4">
          <div 
            className={`text-center transition-all duration-1000 transform ${
              titleVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
            }`}
          >
            {/* Main Title */}
            <h1 className="responsive-title font-bold text-gradient-gold mb-4 tracking-tight">
              Luminous Verses
            </h1>
            
            {/* Subtitle */}
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Journey through the beautiful words of the Quran with 
              <span className="text-gold font-semibold"> interactive learning</span> and 
              <span className="text-purple-300 font-semibold"> enchanting experiences</span>
            </p>

            {/* Decorative line */}
            <div className="flex items-center justify-center mt-6 mb-8">
              <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent w-32"></div>
              <div className="mx-4 text-gold text-2xl">✧</div>
              <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent w-32"></div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <VerseOfTheDay onOpenQuran={handleOpenQuran} />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 py-6">
          <div className="text-center text-white/60 text-sm">
            <p>Made with 💜 for young hearts seeking wisdom</p>
          </div>
        </footer>
      </div>

      {/* Ambient overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/20 via-transparent to-purple-900/10 pointer-events-none z-0"></div>
      
      {/* Surah List Modal */}
      <SurahListModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
