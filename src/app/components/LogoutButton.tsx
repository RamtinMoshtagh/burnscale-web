'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Something went wrong while logging out.');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-red-600 hover:text-red-700 underline transition focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
      aria-label="Log out"
    >
      Log out
    </button>
  );
}
