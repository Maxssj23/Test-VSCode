import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      householdId?: string;
    } & DefaultSession['user'];
  }
}
