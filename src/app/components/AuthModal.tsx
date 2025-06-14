'use client'
import { useStackApp} from '@stackframe/stack'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const stackApp = useStackApp()

  if (!isOpen) return null

  const handleSignIn = async () => {
    try {
      // Use Stack Auth's sign-in redirect
      stackApp.redirectToSignIn()
      onSuccess?.()
      onClose()
  } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="relative w-full max-w-md rounded-3xl shadow-2xl border border-white/40 bg-white/30 backdrop-blur-lg p-8 flex flex-col items-center animate-in fade-in-0 zoom-in-95 duration-300">
          {/* Spiritual Avatar */}
          <div className="mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-3xl">🌙</span>
          </div>
          
          {/* Greeting */}
          <h2 className="text-xl font-bold mb-2 text-white drop-shadow-lg text-center">
            السلام عليكم
          </h2>
          <p className="mb-6 text-white/80 text-center text-sm">
            Sign in to save your favorite verses
          </p>

          {/* Sign In Button */}
          <div className="w-full space-y-4">
            <button 
              onClick={handleSignIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-500 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              🌟 Sign In
            </button>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="mt-4 text-white/60 hover:text-white/80 transition-colors text-sm"
          >
            Maybe later
          </button>
          
          {/* Close X Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
