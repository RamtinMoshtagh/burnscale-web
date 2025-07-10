'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.replace('/');
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) router.replace('/');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) setError(error.message);
    } catch (err) {
      console.error(err);
      setError('Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left: Branding / Welcome */}
      <div className="hidden md:flex flex-col justify-center items-center bg-blue-600 text-white w-full md:w-1/2 p-12">
        <h2 className="text-4xl font-extrabold mb-4">Welcome to BurnScale.AI</h2>
        <p className="text-lg text-blue-100 max-w-md text-center">
          Understand your burnout patterns. Feel better. Live better.
        </p>
        <Image
  src="https://illustrations.popsy.co/gray/working-from-home.svg"
  alt="Illustration"
  width={288}
  height={288}
  className="mt-10"
/>


      </div>

      {/* Right: Auth Card */}
      <div className="w-full md:w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>

          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
className="w-full px-4 py-2 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
className="w-full px-4 py-2 text-gray-900 placeholder-gray-400 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" aria-live="polite">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp((prev) => !prev)}
              className="text-blue-600 font-medium hover:underline transition"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
