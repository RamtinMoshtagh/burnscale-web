// src/app/auth/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';

// Basic email validation
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { session, isLoading: sessionLoading } = useSessionContext();

  // If already signed in, send to check-in
  useEffect(() => {
    if (session) {
      router.replace('/check-in');
    }
  }, [session, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const magicLinkRedirect = 'https://burnscale-web.vercel.app/auth/login';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!emailPattern.test(email)) {
      setErrorMsg('Enter a valid e-mail address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    let authResult;
    if (isSignUp) {
      // Sign-up (magic link) flow
      authResult = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: magicLinkRedirect },
      });
    } else {
      // Password sign-in (no redirect option)
      authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (authResult.error) {
      setErrorMsg(authResult.error.message);
    }
    setSubmitting(false);
  }

  if (sessionLoading) {
    // Wait until we know session state
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Illustration */}
      <aside className="hidden w-1/2 flex-col items-center justify-center bg-blue-600 p-12 text-white md:flex">
        <h2 className="mb-4 text-4xl font-extrabold">Welcome to BurnScale.AI</h2>
        <p className="max-w-md text-center text-lg text-blue-100">
          Understand your burnout patterns. Feel better. Live better.
        </p>
      </aside>

      {/* Auth form */}
      <section className="flex w-full items-center justify-center p-8 md:w-1/2">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-600">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-600">
                Password
              </span>
              <input
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500"
              />
            </label>

            {errorMsg && (
              <p className="text-sm text-red-600" role="alert">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Please wait…'
                : isSignUp
                ? 'Sign up'
                : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="font-medium text-blue-600 hover:underline"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
