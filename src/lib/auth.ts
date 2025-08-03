import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import EmailProvider from 'next-auth/providers/email';
import { householdMembers } from './db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const member = await db.query.householdMembers.findFirst({
          where: eq(householdMembers.userId, user.id),
        });
        if (member) {
          session.user.householdId = member.householdId;
        }
      }
      return session;
    },
  },
});
