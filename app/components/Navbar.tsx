'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkAuthToken = () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  useEffect(() => {
    checkAuthToken();
    setMounted(true);
    window.addEventListener('local-storage-update', checkAuthToken);
    return () => {
      window.removeEventListener('local-storage-update', checkAuthToken);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    router.push('/login');
    router.refresh();
  };

  if (!mounted) {
    return <nav className="bg-black border-b border-slate-900 sticky top-0 z-50 h-16 w-full" />;
  }

  return (
    /* 🎨 Exact Matching Gradient: Left (Black) to Right (Solid Green-900 like Sidebar Bottom) */
    <nav className="bg-gradient-to-r from-black via-slate-950 to-green-900 border-b border-slate-900 sticky top-0 z-50 shadow-md shadow-black/40 w-full transition-all duration-300">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Brand Logo Group (Stays in the clean dark/black zone) */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              
              {/* Branding Header Text */}
              <span className="font-black text-xl tracking-wider text-white uppercase select-none font-inter">
                Ticket<span className="text-green-500 transition-colors duration-200 group-hover:text-green-400">Flow</span>
              </span>
            </Link>
          </div>

          {/* Right Side: Dynamic Toggle Auth Button (Sits right on top of the rich green aura) */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <button 
                onClick={handleSignOut}
                className="text-[10px] font-extrabold uppercase tracking-widest text-green-400 border border-green-500/30 bg-black/40 backdrop-blur-sm hover:bg-green-500 hover:text-slate-950 px-5 py-2.5 rounded-xl shadow-lg transition-all transform active:scale-[0.97] duration-150 inline-block text-center cursor-pointer font-inter"
              >
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login" 
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-300 hover:to-green-400 px-5 py-2.5 rounded-xl shadow-lg shadow-green-500/10 transition-all transform active:scale-[0.97] duration-150 inline-block text-center font-inter"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}