// app/components/LogoutButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

/**
 * Re-usable, accessible logout button.
 *
 * • Uses the auth-helpers `useSupabaseClient()` hook (no singleton import)
 * • Disables itself + shows “Logging out…” state while awaiting sign-out
 * • `router.replace` avoids leaving “/auth/login” in back-stack
 * • Lucide icon for clear affordance
 */
export default function LogoutButton() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error('Logout failed:', error);
      alert('Something went wrong while logging out.');
      return;
    }
    router.replace('/auth/login');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      aria-label="Log out"
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={14} />
      {loading ? 'Logging out…' : 'Log out'}
    </button>
  );
}
