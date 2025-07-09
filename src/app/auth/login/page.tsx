'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) router.replace('/app');
    };
    checkSession();
  }, [router]);

  // Listen for session change
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/app');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    }
    // No redirect here — let `onAuthStateChange` handle it
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white w-full max-w-md rounded-xl p-8 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create an account' : 'Log in to your account'}
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-300"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>

          <p className="text-sm text-center text-gray-600 mt-2">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 underline font-medium"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
