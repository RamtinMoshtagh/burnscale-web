// src/app/components/SessionContextProvider.tsx
'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';
import type { Session } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/app/types/supabase';

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabaseClient] = useState(() =>
    createPagesBrowserClient<Database>()
  );

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
