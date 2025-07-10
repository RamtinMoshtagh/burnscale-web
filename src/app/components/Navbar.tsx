'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Menu, X } from 'lucide-react';

/* ---------------------------------- */
/*  Nav link config                   */
/* ---------------------------------- */
const LINKS = [
  { href: '/dashboard', label: 'Dashboard', auth: true },
];

/* ---------------------------------- */
/*  Component                         */
/* ---------------------------------- */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session } = useSessionContext();          // <- easiest auth hook
  const supabase = createClientComponentClient();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthed = !!session?.user;

  /* logout helper */
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }, [router, supabase]);

  /* shared link renderer */
  const linkEls = LINKS.filter(
    (l) => (!l.auth || isAuthed) && pathname !== '/auth/login'
  ).map((l) => (
    <Link
      key={l.href}
      href={l.href}
      onClick={() => setMenuOpen(false)}
      className={`rounded px-2 py-1 text-sm transition hover:text-blue-600 ${
        pathname === l.href ? 'font-semibold text-blue-600' : 'text-gray-700'
      }`}
    >
      {l.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold">
          <span className="text-blue-700">Burn</span>
          <span className="text-gray-800">Scale.AI</span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center space-x-4 sm:flex"
          role="navigation"
          aria-label="Main"
        >
          {linkEls}
          {isAuthed && (
            <button
              onClick={handleLogout}
              className="rounded px-2 py-1 text-sm text-red-600 hover:underline"
            >
              Log&nbsp;out
            </button>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded p-1 text-gray-700 focus:outline-none focus-visible:ring sm:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu (animated slide-down) */}
      <nav
        id="mobile-nav"
        className={`origin-top transform px-4 pb-4 transition-all duration-200 sm:hidden ${
          menuOpen
            ? 'scale-y-100 opacity-100'
            : 'pointer-events-none scale-y-0 opacity-0'
        }`}
      >
        {linkEls}
        {isAuthed && (
          <button
            onClick={handleLogout}
            className="mt-2 block w-full text-left text-sm text-red-600 hover:underline"
          >
            Log&nbsp;out
          </button>
        )}
      </nav>
    </header>
  );
}
