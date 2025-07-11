'use client'
import { useState } from 'react'
import { useUser, useStackApp } from '@stackframe/stack'
import { BookmarksModal } from './BookmarksModal'
import AuthModal from './AuthModal'

interface UserProfileButtonProps {
  onVerseSelect?: (surahId: number, verseNumber: number) => void
}

export function UserProfileButton({ onVerseSelect }: UserProfileButtonProps) {
  const user = useUser()
  const [showBookmarksModal, setShowBookmarksModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  

  const stackApp = useStackApp()

  const handleSignOut = () => {
    stackApp.redirectToSignOut()
    setShowDropdown(false)
  }

  const handleBookmarksClick = () => {
    setShowBookmarksModal(true)
    setShowDropdown(false)
  }

  const handleSignIn = () => {
    
    setShowAuthModal(true);
  }

  if (!user) {
    return (
      <>
        <button
          onClick={handleSignIn}
          className="group relative flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-white/80 text-sm font-medium">Sign In</span>
          
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Sign in to save bookmarks
          </div>
        </button>
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          mode="signin"
        />
      </>
    )
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="group relative flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user.displayName?.charAt(0).toUpperCase() || user.primaryEmail?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-white/80 text-sm font-medium max-w-24 truncate">
              {user.displayName || user.primaryEmail || 'User'}
            </span>
            <span className="text-white/50 text-xs">
              Registered
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-white/60 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            
            <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl z-20 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="p-2">
                <div className="px-3 py-2 border-b border-white/20 mb-2">
                  <div className="text-white/90 font-medium text-sm">{user.displayName || 'User'}</div>
                  <div className="text-white/60 text-xs">{user.primaryEmail}</div>
                  <div className="text-white/50 text-xs mt-1">
                    ✅ Registered User
                  </div>
                </div>

                <button
                  onClick={handleBookmarksClick}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 text-left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>My Bookmarks</span>
                </button>
                
                <div className="my-1 h-px bg-white/20" />
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 text-left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      <BookmarksModal 
        isOpen={showBookmarksModal} 
        onClose={() => setShowBookmarksModal(false)}
        onVerseSelect={onVerseSelect}
      />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode="signin"
      />
    </>
  )
}
