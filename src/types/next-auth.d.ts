import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      familyId?: string | null
    } & DefaultSession['user']
  }
  interface User {
    familyId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    familyId?: string | null
  }
}
