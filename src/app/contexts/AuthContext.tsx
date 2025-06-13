'use client'
import { createContext, useContext, ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  userType?: string
}

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
  isRegistered: false,
  backendToken: undefined,
  showAuthModal: false,
  setShowAuthModal: () => {},
  signIn: () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const user = session?.user || null
  const isAuthenticated = !!session?.user
  const isGuest = (user as User)?.userType === 'guest'
  const isRegistered = (user as User)?.userType === 'registered'
  const backendToken = (session as { backendToken?: string })?.backendToken

  const handleSignIn = () => {
    setShowAuthModal(true)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading: status === 'loading',
      isGuest,
      isRegistered,
      backendToken,
      showAuthModal,
      setShowAuthModal,
      signIn: handleSignIn,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)