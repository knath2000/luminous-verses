'use client'

import { SettingsProvider } from "../contexts/SettingsContext"
import { UserGestureProvider } from "../contexts/UserGestureContext"
import { AudioProvider } from "../contexts/AudioContext"
import AutoplayManager from "./AutoplayManager"

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
      <SettingsProvider>
        <UserGestureProvider>
          <AudioProvider>
            <AutoplayManager />
            {children}
          </AudioProvider>
        </UserGestureProvider>
      </SettingsProvider>
  )
}