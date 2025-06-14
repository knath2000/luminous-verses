'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@stackframe/stack'
import AuthModal from './AuthModal'

interface Bookmark {
  id: string
  surahid: number
  versenumber: number
  versetext: string
  surahname: string
  translation: string
}

interface BookmarkHeartProps {
  surahId: number
  verseNumber: number
  verseText: string
  surahName: string
  translation: string
  className?: string
}

export function BookmarkHeart({ 
  surahId, 
  verseNumber, 
  verseText, 
  surahName, 
  translation,
  className = ""
}: BookmarkHeartProps) {
  const user = useUser()
  const isSignedIn = user !== null
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)

  const checkBookmarkStatus = useCallback(async () => {
  if (!user?.id) return

  try {
    const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`,
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      const bookmarks: Bookmark[] = data.data || data
      const existingBookmark = bookmarks.find((b: Bookmark) =>
        b.surahid === surahId && b.versenumber === verseNumber
      )
      
      if (existingBookmark) {
        setIsBookmarked(true)
        setBookmarkId(existingBookmark.id)
      } else {
        setIsBookmarked(false)
        setBookmarkId(null)
      }
    }
  } catch (error) {
    console.error('Error checking bookmark status:', error)
  }
}, [user, surahId, verseNumber])



  // Check if verse is bookmarked on mount and when auth state changes
  useEffect(() => {
    if (isSignedIn && user) {
      checkBookmarkStatus()
    } else {
      setIsBookmarked(false)
      setBookmarkId(null)
    }
  }, [isSignedIn, user, checkBookmarkStatus])

  const handleBookmarkClick = async () => {
    if (!isSignedIn || !user?.id) {
      setShowAuthModal(true)
      return
    }

    setIsLoading(true)
    try {
      if (isBookmarked && bookmarkId) {
        // Delete bookmark
        const response = await fetch(`https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks?id=${bookmarkId}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.id}`,
  }
})
        
        if (response.ok) {
          setIsBookmarked(false)
          setBookmarkId(null)
        }
      } else {
        // Create bookmark
        const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.id}`,
  },
  body: JSON.stringify({
    surahId,
    verseNumber,
    verseText,
    surahName,
    translation
  })
})
        
        if (response.ok) {
          const newBookmark = await response.json()
          setIsBookmarked(true)
          setBookmarkId(newBookmark.id)
        }
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleBookmarkClick}
        disabled={isLoading}
        className={`group relative p-2 rounded-full transition-all duration-300 ${
          isBookmarked 
            ? 'text-red-500 bg-red-100/20 hover:bg-red-100/30' 
            : 'text-gray-400 hover:text-red-400 hover:bg-white/10'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} ${className}`}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" 
            fill={isBookmarked ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
        </div>
      </button>
      
      {/* Glassmorphic Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode="signin"
      />
    </>
  )
}