import './globals.css';
import { ReactNode } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import SupabaseProvider from '@/app/components/SessionContextProvider';
import ClientLayoutShell from '@/app/components/ClientLayoutShell';
import { Session } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/app/types/supabase';


export const metadata = {
  title: 'BurnScale AI',
  description: 'Track your burnout and recovery patterns with AI insight.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies(); // ✅ now properly awaited

  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body>
        <SupabaseProvider initialSession={session as Session}>
          <ClientLayoutShell>{children}</ClientLayoutShell>
        </SupabaseProvider>
      </body>
    </html>
  );
}

