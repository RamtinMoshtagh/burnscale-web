// ✅ app/page.tsx (must be a Server Component – no 'use client')
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/auth/login');
}
