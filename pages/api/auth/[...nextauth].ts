import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const API_BASE = 'https://luminous-verses-api-tan.vercel.app'

interface Credentials {
  username?: string
  email?: string
  password?: string
}

interface User {
  id: string
  name: string
  email: string
  userType?: string
  token?: string
}

interface Token {
  sub?: string
  name?: string
  userType?: string
  backendToken?: string
  [key: string]: unknown
}

interface Session {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
    userType?: string
  }
  backendToken?: string
  [key: string]: unknown
}

// @ts-expect-error - NextAuth v4 typing issue
export default NextAuth({
  providers: [
    // Registered Users Provider
    CredentialsProvider({
      id: 'credentials',
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Credentials | undefined) {
        if (!credentials?.email || !credentials?.password) {
          // Check if this is a guest login attempt
          if (credentials?.username && typeof credentials.username === 'string') {
            const username = credentials.username.trim()
            if (username.length >= 2) {
              return {
                id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: username,
                email: `${username.toLowerCase().replace(/\s+/g, '')}@guest.local`,
                userType: 'guest'
              }
            }
          }
          return null
        }

        try {
          // Authenticate with backend API for registered users
          const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          })

          if (!response.ok) {
            console.error('Backend authentication failed:', response.status)
            return null
          }

          const data = await response.json()
          
          if (data.success && data.data?.user) {
            return {
              id: data.data.user.id,
              name: data.data.user.name,
              email: data.data.user.email,
              userType: 'registered',
              token: data.data.token
            }
          }
        } catch (error) {
          console.error('Authentication error:', error)
        }
        
        return null
      }
    })
  ],
  callbacks: {
    jwt({ token, user }: { token: Token; user?: User }) {
      if (user) {
        token.sub = user.id
        token.name = user.name
        token.userType = user.userType || 'guest'
        
        // Store backend JWT token for registered users
        if (user.token) {
          token.backendToken = user.token
        }
      }
      return token
    },
    session({ session, token }: { session: Session; token: Token }) {
      if (token.sub && session.user) {
        // Extend the user object with id property
        session.user.id = token.sub
        session.user.name = token.name as string
        session.user.userType = token.userType as string
        
        // Include backend token for API calls
        if (token.backendToken) {
          session.backendToken = token.backendToken
        }
      }
      return session
    },
    async signIn() {
      // Allow all successful authentications
      return true
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
})