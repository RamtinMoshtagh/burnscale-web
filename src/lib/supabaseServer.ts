// lib/supabaseServer.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client helper.
 *
 * • No direct `cookies().get()` calls → avoids hydration warnings.  
 * • Keep the generic `<any>` or swap in your generated `Database` type once you
 *   run `supabase gen types typescript --local`.
 */
export function supabaseServer() {
  return createServerComponentClient<any>({ cookies });
}
