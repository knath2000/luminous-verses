import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL, // Your existing Neon database URL
  },
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
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    }
  },
  plugins: [
    nextCookies() // Enables automatic cookie handling for Next.js
  ],
  trustedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
    "exp://192.168.1.100:8081", // Your Expo development server
    "luminous-verses://" // Your app scheme
  ]
})

export type Session = typeof auth.$Infer.Session 