import { signIn } from '@/lib/auth';

export default function SignInPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <form
        action={async () => {
          'use server';
          await signIn('email', { email: 'user@example.com' });
        }}
      >
        <button type="submit">Sign in with Email</button>
      </form>
    </div>
  );
}