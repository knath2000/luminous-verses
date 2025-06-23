import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // 5 minutes cache for better performance
    }
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false // Disable for React Native compatibility
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [
    nextCookies() // Enables automatic cookie handling for Next.js
  ],
  trustedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    "exp://192.168.1.134:8081",
    "luminous-verses://",
    "https://luminous-verses.vercel.app",
    "*" // Allow all origins for React Native
  ]
})

export type Session = typeof auth.$Infer.Session 