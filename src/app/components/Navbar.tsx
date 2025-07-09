'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Menu, X } from 'lucide-react'; // You can use any icon library here

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setIsAuthenticated(true);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <header className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-700">
          <span className="text-blue-700">Burn</span>
          <span className="text-gray-800">Scale.AI</span>
        </Link>

        <div className="sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="hidden sm:flex items-center space-x-4">
          {isAuthenticated && pathname !== '/auth/login' && (
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Log out
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4">
          {isAuthenticated && pathname !== '/auth/login' && (
            <button
              onClick={handleLogout}
              className="block w-full text-left text-red-600 hover:underline"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
