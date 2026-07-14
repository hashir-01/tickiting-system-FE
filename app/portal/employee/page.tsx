'use client';

import { useEffect, useState } from 'react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
}

export default function IamDashboardPage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'IAM Administrator',
    email: 'admin@ticketflow.internal',
    role: 'IAM',
    department: 'Identity & Security Operations',
  });

  // 🛡️ ULTRA-SMOOTH NO-FLASH NAVIGATION LOCK ENGINE
  useEffect(() => {
    // 1. History stack ko advance entries se fill karo taake back dabane par ye dummy layers par jaye
    window.history.pushState(null, '', window.location.href);
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // 2. Back button dabe toh bina redirect ya window reload kiye instant lock lagao
      window.history.pushState(null, '', window.location.href);
      
      // 3. Browser navigation focus ko forcefully real-time forward thuk do
      window.history.forward();
    };

    window.addEventListener('popstate', handlePopState);

    // Initial forward check for strict safety boundary
    window.history.forward();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 📥 Sync profile metrics from local session identifiers
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    const storedDept = localStorage.getItem('userDepartment');

    if (storedName || storedEmail || storedRole || storedDept) {
      setProfile({
        name: storedName || 'IAM Administrator',
        email: storedEmail || 'admin@ticketflow.internal',
        role: storedRole || 'IAM',
        department: storedDept || 'Identity & Security Operations',
      });
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4">
      
      {/* Black and Green Profile Header */}
      <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-green-950/80 border border-green-500/30 text-green-500 px-2 py-0.5 rounded">
            Profile Active
          </span>
          <h1 className="text-xl font-black uppercase tracking-tight mt-2">
            {profile.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-wider text-green-500">Online</span>
        </div>
      </div>

      {/* Profile Metrics Grid Container */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Name</p>
          <p className="text-sm font-bold text-slate-950 mt-0.5">{profile.name}</p>
        </div>
        
        <div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Email Address</p>
          <p className="text-sm font-bold text-slate-950 mt-0.5 break-all">{profile.email}</p>
        </div>

        <div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">System Role</p>
          <div className="mt-1">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-green-50 border border-green-200 text-green-700 rounded-md">
              {profile.role}
            </span>
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Department</p>
          <p className="text-sm font-bold text-slate-950 mt-0.5">{profile.department}</p>
        </div>
      </div>

    </div>
  );
}