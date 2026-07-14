'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    if (!/^[A-Z]/.test(password)) return 'The very first character must be an Uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are strictly required.');
      return;
    }

    const validationMessage = validatePassword(newPassword);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New Password and Confirm Password fields do not match.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token'); 
      
      const response = await fetch('http://localhost:3001/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update credentials.');
      }

      setSuccess('Password updated successfully! Redirecting...');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/portal/my-tickets'); 
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white px-4 pb-4">
      
      {/* Header Section */}
      <div className="mt-1 mb-2 shrink-0">
        <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
          Change Password
        </h1>
      </div>

      {/* Main Content Viewport Area */}
      <div className="flex-1 flex items-start justify-center pt-1">
        
        {/* Compact & Smaller Card Wrapper */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 shadow-sm max-w-sm w-full">
          <form onSubmit={handleSubmit} className="space-y-2.5">
            
            {/* Error Notification */}
            {error && (
              <div className="bg-rose-50/60 border border-rose-200 text-rose-700 font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                ⚠️ {error}
              </div>
            )}

            {/* Success Notification */}
            {success && (
              <div className="bg-green-50/60 border border-green-200 text-green-800 font-bold text-[11px] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                ✅ {success}
              </div>
            )}

            {/* 1. Current Password */}
            <div>
              <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest block mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
              />
            </div>

            <hr className="border-slate-200/60 my-0.5" />

            {/* 2. New Password */}
            <div>
              <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest block mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="E.g., P@ss12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
              />
              
              {/* Ultra Compact Rules Panel */}
              <div className="mt-1.5 bg-white p-2 rounded-lg border border-slate-200 text-[9px] space-y-0.5 shadow-inner">
                <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded mb-0.5">
                  Security Protocol
                </span>
                <p className="text-slate-600 font-bold uppercase tracking-wide">• Min 6 characters long</p>
                <p className="text-slate-600 font-bold uppercase tracking-wide">• First letter must be <span className="text-green-600 font-black">Uppercase</span></p>
                <p className="text-slate-600 font-bold uppercase tracking-wide">• Must include 1 number (0-9)</p>
                <p className="text-slate-600 font-bold uppercase tracking-wide">• Must include 1 special character</p>
              </div>
            </div>

            {/* 3. Confirm Password */}
            <div>
              <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] py-2 rounded-lg disabled:bg-slate-300 transition-all shadow-md active:scale-95 cursor-pointer mt-1"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}