import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === 'production' 
    ? "https://luminous-verses.vercel.app" 
    : "http://localhost:3000"
})

export const { signIn, signOut, signUp, useSession } = authClient 