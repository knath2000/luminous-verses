'use client'

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "../contexts/AuthContext"
import { SettingsProvider } from "../contexts/SettingsContext"
import { UserGestureProvider } from "../contexts/UserGestureContext"
import { AudioProvider } from "../contexts/AudioContext"
import AutoplayManager from "./AutoplayManager"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <SettingsProvider>
          <UserGestureProvider>
            <AudioProvider>
              <AutoplayManager />
              {children}
            </AudioProvider>
          </UserGestureProvider>
        </SettingsProvider>
      </AuthProvider>
    </SessionProvider>
  )
}