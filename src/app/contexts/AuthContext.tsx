'use client'
import { createContext, useContext, ReactNode } from 'react'

interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  userType?: string
}

// Keep the same interface for compatibility
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isGuest: boolean
  isRegistered: boolean
  backendToken?: string
  showAuthModal: boolean
  setShowAuthModal: (show: boolean) => void
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isGuest: false,
  isRegistered: true, // Stack Auth users are always registered
  backendToken: undefined,
  showAuthModal: false,
  setShowAuthModal: () => {},
  signIn: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // This is just a wrapper now since Stack Auth is handled at the layout level
  // We'll use useUser hook directly in components that need auth
  return (
    <AuthContext.Provider value={{
      user: null, // Will be handled by useUser hook directly
      isAuthenticated: false, // Will be handled by useUser hook directly
      isLoading: false,
      isGuest: false,
      isRegistered: true,
      backendToken: undefined,
      showAuthModal: false,
      setShowAuthModal: () => {},
      signIn: () => {},
      signOut: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
