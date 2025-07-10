// ✅ app/page.tsx – Server Component
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/auth/login');
  return null; // Required fallback to avoid hydration issues
}
