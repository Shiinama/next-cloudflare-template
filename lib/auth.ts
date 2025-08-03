import { DrizzleAdapter } from '@auth/drizzle-adapter'
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import ResendProvider from 'next-auth/providers/resend'

import { FREE_USER_TOKENS } from '@/config/token'
import { createDb } from '@/lib/db'

import { accounts, sessions, users, userUsage, verificationTokens } from './db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = createDb()

  return {
    secret: process.env.AUTH_SECRET,
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens
    }),
    providers: [
      Google,
      ResendProvider({
        from: 'no-reply@getwhynot.org'
      })
    ],
    session: {
      strategy: 'jwt'
    },
    callbacks: {
      jwt: async ({ token, user }) => {
        if (user) {
          token.id = user.id
        }
        return token
      },
      session: async ({ session, token }) => {
        if (token && session.user) {
          session.user.id = token.id as string
        }
        return session
      }
    },
    events: {
      createUser: async ({ user }) => {
        await db.insert(userUsage).values({
          userId: user.id!,
          usedTokens: 0,
          totalTokens: FREE_USER_TOKENS
        })
      }
    }
  }
})
