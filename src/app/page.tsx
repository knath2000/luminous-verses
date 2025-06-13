'use client';

import { useEffect, useState } from 'react';
import SurahListModal from './components/SurahListModal';
import SettingsButton from './components/SettingsButton';
import SettingsModal from './components/SettingsModal';
import { VerseOfTheDay as AudioVerseOfTheDay } from './components/VerseOfTheDay';
import { UserProfileButton } from './components/UserProfileButton';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';



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


// Main Home Component
export default function Home() {
  const [titleVisible, setTitleVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { showAuthModal, setShowAuthModal } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setTitleVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);


  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
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
          {/* User Profile Button - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <UserProfileButton />
          </div>
          
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
            <AudioVerseOfTheDay />
            
            {/* Action Buttons */}
            <div className="text-center mt-8 animate-fadeInUp">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Settings Button */}
                <SettingsButton onClick={handleOpenSettings} />
                
                {/* Open Quran Button */}
                <button
                  onClick={handleOpenModal}
                  className="group relative glass-morphism px-8 py-4 rounded-2xl hover:animate-glow transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-opacity-50"
                  aria-label="Open Quran to explore chapters and verses"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl" role="img" aria-label="book">📖</span>
                    <span className="text-xl font-bold text-gradient-gold">
                      Open Quran
                    </span>
                    <span className="text-2xl" role="img" aria-label="sparkles">✨</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">
                    Explore beautiful chapters and verses
                  </p>
                </button>
              </div>
            </div>
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
      
      {/* Modals */}
      <SurahListModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <SettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
