// src/lib/supabaseServer.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/app/types/supabase';

export const supabaseServer = () =>
  createServerComponentClient<Database>({ cookies });
