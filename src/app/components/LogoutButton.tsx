'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-600 underline hover:text-red-800"
    >
      Log out
    </button>
  );
}
