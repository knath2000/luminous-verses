declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      userType?: string
    }
    backendToken?: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    userType?: string
    token?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    name?: string | null
    email?: string | null
    picture?: string | null
    userType?: string
    backendToken?: string
  }
}