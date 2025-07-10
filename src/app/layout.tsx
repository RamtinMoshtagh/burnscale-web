// src/app/layout.tsx

import './globals.css';
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import type { Metadata } from 'next';
import type { Database } from '@/app/types/supabase';

import SupabaseProvider from '@/app/components/SessionContextProvider';
import ClientLayoutShell from '@/app/components/ClientLayoutShell';

export const metadata: Metadata = {
  title: 'BurnScale AI',
  description: 'Track your burnout and recovery patterns with AI insight.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();

  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <head />
      <body className="bg-gray-50 text-gray-900">
        <SupabaseProvider initialSession={session as Session}>
          <ClientLayoutShell>{children}</ClientLayoutShell>
        </SupabaseProvider>
      </body>
    </html>
  );
}
