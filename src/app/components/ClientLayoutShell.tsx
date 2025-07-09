'use client';

import { useSession } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const session = useSession();

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold tracking-tight text-blue-700">BurnScale.AI</span>
          </Link>

          <nav className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-600">Hi, {session.user.email}</span>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </>
  );
}
