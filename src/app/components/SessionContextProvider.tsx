'use client';

import React, { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/app/types/supabase';

interface SupabaseProviderProps {
  children: React.ReactNode;
  initialSession: Session | null;
}

const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
  initialSession,
}) => {
  const [supabaseClient] = useState(() =>
    createPagesBrowserClient<Database>()
  );

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient as unknown as SupabaseClient<Database>}
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
};

export default SupabaseProvider;
