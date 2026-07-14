'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); 
  const [authorized, setAuthorized] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState({ name: 'Loading...', role: 'LOADING...', dept: 'LOADING...' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) {
      router.replace('/login');
      return;
    }

    setAuthorized(true);
    setEmployeeInfo({ 
      name: localStorage.getItem('userName') || 'Operator', 
      role: role || 'UNKNOWN', 
      dept: localStorage.getItem('userDepartment') || 'Operations Division' 
    });
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-xs font-bold uppercase tracking-widest text-green-500 animate-pulse">
          Verifying Security Clearance...
        </div>
      </div>
    );
  }

  const isCreateTicketPage = pathname === '/portal/create-ticket';

  return (
    /* 🛠️ ULTIMATE FIX 1: Root container ko strictly fixed block banaya aur 'overflow-hidden' se browser ke scrollbar ki chutti kar di */
    <div className="fixed inset-x-0 bottom-0 top-[64px] flex flex-col md:flex-row bg-white text-slate-900 overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar employeeInfo={employeeInfo} />
      
      {/* Main Content Area Wrapper */}
      {/* 🛠️ ULTIMATE FIX 2: Content layer ko flex-1 karke block space freeze kiya */}
      <div className="flex-1 flex flex-col h-full bg-white text-slate-900 relative w-full overflow-hidden">
        
        {/* Global Sub-Header Layer for Action Controls */}
        <div className="w-full flex justify-end items-center px-4 md:px-8 pt-4 md:pt-6 pb-2 min-h-[44px] shrink-0 bg-white">
          {!isCreateTicketPage && (
            <Link
              href="/portal/create-ticket"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-md shadow-green-600/10 hover:shadow-green-600/20 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Launch Ticket
            </Link>
          )}
        </div>

        {/* Dynamic Pages Area */}
        {/* 🛠️ ULTIMATE FIX 3: Ab pure system mein sirf aur sirf yeh area hi scrollable hai */}
        <div className="flex-1 p-4 md:p-8 pt-2 overflow-y-auto overflow-x-hidden base-page-scroller">
          {children} 
        </div>
      </div>
    </div>
  );
}