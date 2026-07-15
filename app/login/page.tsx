'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // 🛡️ Flash protection flag

  useEffect(() => {
    // History mein ek dummy state push karo
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 🛡️ ANTI-BACK BUTTON & AUTO-REDIRECT GUARD
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole')?.toUpperCase();

    if (token && userRole) {
      if (userRole === 'IAM') {
        router.replace('/portal/IAM');
      } else if (userRole === 'SUPER_ADMIN') {
        router.replace('/portal/super-admin');
      } else if (userRole === 'MANAGER') {
        router.replace('/portal/manager-portal');
      } else {
        router.replace('/portal/employee');
      }
    } else {
      // Agar koi active session nahi mila, tabhi login screen mount hone do
      setIsChecking(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('https://ticketing-system-be-lkut.onrender.com/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials.');
      }

      // Save token and user properties to local storage
      localStorage.setItem('token', data.authToken);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userDepartment', data.user.department);

      // Trigger the navbar to immediately sync its auth state changes
      window.dispatchEvent(new Event('local-storage-update'));
      
      const userRole = data.user.role ? data.user.role.toUpperCase() : '';

      if (userRole === 'IAM') {
        router.replace('/portal/IAM');
      } else if (userRole === 'SUPER_ADMIN') {
        router.replace('/portal/super-admin');
      } else if (userRole === 'MANAGER') {
        router.replace('/portal/manager-portal');
      } else {
        router.replace('/portal/employee');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🛑 AGER USER INTEGRITY REDIRECT HORHI HAI TOU FORM FLASH RESTRICT KREIN
  if (isChecking) {
    return (
      <div className="fixed inset-0 h-screen w-screen bg-slate-950 flex flex-col items-center justify-center z-[9999]">
        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest animate-pulse">
          Verifying session handshake...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center py-20 bg-white">
      <div className="sm:mx-auto w-full max-w-[440px] px-4 sm:px-0">
        <div className="bg-slate-50 p-10 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-600 bg-clip-text text-transparent select-none pb-1">
              Sign In
            </h2>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 bg-white text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 bg-white text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider text-white bg-slate-950 hover:bg-green-600 focus:outline-none transition-colors duration-150 disabled:opacity-50 uppercase shadow-sm"
              >
                {isLoading ? 'Verifying...' : 'Log in'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium leading-relaxed text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}