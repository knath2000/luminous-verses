'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultTab?: 'login' | 'register' | 'guest'
}

type AuthTab = 'login' | 'register' | 'guest'

interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface GuestForm {
  username: string
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ 
    name: '', email: '', password: '', confirmPassword: '' 
  })
  const [guestForm, setGuestForm] = useState<GuestForm>({ username: '' })

  if (!isOpen) return null

  const handleLogin = async () => {
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // First authenticate with backend API
      const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Then sign in with NextAuth using the backend response
      const result = await signIn('credentials', {
        email: loginForm.email.trim(),
        password: loginForm.password,
        redirect: false
      })
      
      if (result?.ok) {
        onSuccess?.()
        onClose()
        setTimeout(() => window.location.reload(), 100)
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerForm.name.trim() || !registerForm.email.trim() || 
        !registerForm.password.trim() || !registerForm.confirmPassword.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Register with backend API
      const response = await fetch('https://luminous-verses-api-tan.vercel.app/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          password: registerForm.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Auto-login after successful registration
      const loginResult = await signIn('credentials', {
        email: registerForm.email.trim(),
        password: registerForm.password,
        redirect: false
      })
      
      if (loginResult?.ok) {
        onSuccess?.()
        onClose()
        setTimeout(() => window.location.reload(), 100)
      } else {
        // Registration succeeded but login failed, switch to login tab
        setActiveTab('login')
        setLoginForm({ email: registerForm.email, password: '' })
        setError('Registration successful! Please log in.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    if (!guestForm.username.trim() || guestForm.username.trim().length < 2) {
      setError('Username must be at least 2 characters')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn('credentials', {
        username: guestForm.username.trim(),
        redirect: false
      })
      
      if (result?.ok) {
        onSuccess?.()
        onClose()
        setTimeout(() => window.location.reload(), 100)
      } else {
        throw new Error('Guest login failed')
      }
    } catch (error) {
      console.error('Guest login error:', error)
      setError(error instanceof Error ? error.message : 'Guest login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeTab === 'login') handleLogin()
      else if (activeTab === 'register') handleRegister()
      else if (activeTab === 'guest') handleGuestLogin()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const TabButton = ({ tab, label, isActive }: { tab: AuthTab; label: string; isActive: boolean }) => (
    <button
      onClick={() => {
        setActiveTab(tab)
        setError(null)
      }}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-white/30 text-white shadow-lg' 
          : 'text-white/70 hover:text-white/90 hover:bg-white/10'
      } disabled:opacity-50`}
    >
      {label}
    </button>
  )

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

          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 bg-white/10 rounded-xl p-1">
            <TabButton tab="login" label="Login" isActive={activeTab === 'login'} />
            <TabButton tab="register" label="Register" isActive={activeTab === 'register'} />
            <TabButton tab="guest" label="Guest" isActive={activeTab === 'guest'} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-100 text-sm text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="w-full space-y-4">
              <input
                type="email"
                placeholder="Email address"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
              />
              <button 
                onClick={handleLogin}
                disabled={isLoading || !loginForm.email.trim() || !loginForm.password.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-500 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : '🌟 Sign In'}
              </button>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="w-full space-y-4">
              <input
                type="text"
                placeholder="Full name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
                autoFocus
              />
              <input
                type="email"
                placeholder="Email address"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
              />
              <button 
                onClick={handleRegister}
                disabled={isLoading || !registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password.trim() || !registerForm.confirmPassword.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-500 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : '✨ Create Account'}
              </button>
            </div>
          )}

          {/* Guest Form */}
          {activeTab === 'guest' && (
            <div className="w-full space-y-4">
              <input
                type="text"
                placeholder="Choose a username"
                value={guestForm.username}
                onChange={(e) => setGuestForm({ username: e.target.value })}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl bg-white/40 border border-white/30 text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all duration-200 focus:bg-white/50"
                disabled={isLoading}
                autoFocus
                minLength={2}
                maxLength={20}
              />
              <button 
                onClick={handleGuestLogin}
                disabled={isLoading || !guestForm.username.trim() || guestForm.username.trim().length < 2}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-500 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : '🌟 Continue as Guest'}
              </button>
            </div>
          )}
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="mt-4 text-white/60 hover:text-white/80 transition-colors text-sm disabled:opacity-50"
          >
            Maybe later
          </button>
          
          {/* Close X Button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-white/60 hover:text-white/80 transition-colors disabled:opacity-50"
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