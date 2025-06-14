'use client'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@stackframe/stack'
import { useRouter } from 'next/navigation'

interface Bookmark {
  id: string
  surahid: number
  versenumber: number
  versetext: string
  surahname: string
  translation: string
  createdat: string
}

interface BookmarksModalProps {
  isOpen: boolean
  onClose: () => void
  onVerseSelect?: (surahId: number, verseNumber: number) => void
}

export function BookmarksModal({ isOpen, onClose, onVerseSelect }: BookmarksModalProps) {
  const user = useUser()
  const isSignedIn = user !== null
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBookmarks = useCallback(async () => {
  if (!user?.id) return

  setIsLoading(true)
  setError(null)
  try {
    // For Stack Auth, we might need to use the session or a different method
    // Try getting the token from the user session
    const token = user.id

    const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      setBookmarks(data.data || data)
    } else {
      console.error('Fetch bookmarks failed:', response.status, response.statusText)
      setError('Failed to load bookmarks')
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    setError('Failed to load bookmarks')
  } finally {
    setIsLoading(false)
  }
}, [user])



  useEffect(() => {
    if (isOpen && isSignedIn && user) {
      fetchBookmarks()
    } else if (isOpen && !isSignedIn) {
      setShowAuthModal(true)
      onClose()
    }
  }, [isOpen, isSignedIn, user, fetchBookmarks, onClose])

  const deleteBookmark = async (bookmarkId: string) => {
  if (!user?.id) return

  try {
    // Use the same token approach
    const token = user.id
    
    const response = await fetch(`https://luminous-verses-api-tan.vercel.app/api/v1/user-bookmarks?id=${bookmarkId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    })
    
    if (response.ok) {
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    } else {
      console.error('Delete bookmark failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Error deleting bookmark:', error)
  }
}


  const handleVerseClick = (surahId: number, verseNumber: number) => {
    onVerseSelect?.(surahId, verseNumber)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-white/40 bg-white/20 backdrop-blur-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-white/30 backdrop-blur-lg border-b border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📖</span>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  My Bookmarks
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/10"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3 text-white/80">
                  <svg className="animate-spin h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading bookmarks...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white/80">{error}</p>
                </div>
                <button
                  onClick={fetchBookmarks}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-white/60 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-lg text-white/80 mb-2">No bookmarks yet</p>
                  <p className="text-sm text-white/60">Start bookmarking your favorite verses!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group bg-white/10 hover:bg-white/20 rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer"
                    onClick={() => handleVerseClick(bookmark.surahid, bookmark.versenumber)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-gold font-bold text-lg">
                          {bookmark.surahid}:{bookmark.versenumber}
                        </span>
                        <span className="text-white/60 text-sm">
                          {bookmark.surahname}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBookmark(bookmark.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200 p-1 rounded-full hover:bg-red-500/20"
                        title="Remove bookmark"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="text-right mb-3">
                      <p className="text-white text-lg leading-relaxed font-arabic" dir="rtl" style={{ fontFamily: 'var(--font-amiri)' }}>
                        {bookmark.versetext}
                      </p>
                    </div>
                    
                    {bookmark.translation && (
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-white/80 text-sm leading-relaxed">
                          {bookmark.translation}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-white/50">
                      <span>Click to navigate</span>
                      <span>{new Date(bookmark.createdat).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Simple auth modal with navigation to sign-in page */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAuthModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Sign in to view bookmarks</h3>
            <p className="text-gray-600 mb-4">Create an account to save and view your favorite verses.</p>
            <div className="flex gap-2">
              <button 
                onClick={() => router.push('/sign-in')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}