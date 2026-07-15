'use client';

import React, { useState, useEffect } from 'react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  cnic: string;
  role: string;
  departmentId: number;
  department?: {
    name: string;
    code: string;
  };
}

export default function ManageAccountsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'search'>('create');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  // FORM STATE: CREATE ACCOUNT
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cnic: '',
    role: '', 
    departmentId: '',
  });
  const [createStatus, setCreateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE: SEARCH ACCOUNTS
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // STATE: EDIT MODAL
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // STATE: CUSTOM BANNER NOTIFICATIONS (Replacing Native Alerts)
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);

  const fetchDepts = async () => {
    try {
      const res = await fetch('https://ticketing-system-be-lkut.onrender.com/department', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed loading departments', err);
    } finally {
      setIsLoadingDepts(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  // Auto clear custom banner notification alerts after 4 seconds
  useEffect(() => {
    if (bannerNotice) {
      const timer = setTimeout(() => setBannerNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [bannerNotice]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('https://ticketing-system-be-lkut.onrender.com/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          role: formData.role.toUpperCase(),
          departmentId: Number(formData.departmentId),
          targetDepartment: departments.find(d => d.id === Number(formData.departmentId))?.name || ''
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to provision account.');

      setCreateStatus({
        type: 'success',
        message: `Account for ${data.user?.name || 'user'} successfully created! Passphrase generated system-side.`
      });
      setFormData({ name: '', email: '', cnic: '', role: '', departmentId: '' });
    } catch (err: any) {
      setCreateStatus({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search query crashed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const executeAccountDeletion = async () => {
    if (!deleteConfirmation) return;
    const { id } = deleteConfirmation;

    try {
      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        setBannerNotice({ type: 'success', message: 'Account successfully dropped from backend logs.' });
        setDeleteConfirmation(null);
        handleSearch();
      } else {
        setBannerNotice({ type: 'error', message: 'Target profile protection enabled. Failed to delete user.' });
      }
    } catch (err) {
      console.error(err);
      setBannerNotice({ type: 'error', message: 'An error occurred during account deletion execution.' });
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditDeptId(user.departmentId?.toString() || '');
    setEditPassword(''); 
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      const bodyPayload: any = {
        role: editRole.toUpperCase(),
        departmentId: Number(editDeptId),
      };
      if (editPassword.trim()) {
        bodyPayload.password = editPassword; 
      }

      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setBannerNotice({ type: 'success', message: 'User profile parameters modified successfully!' });
        setEditingUser(null);
        handleSearch();
      } else {
        setBannerNotice({ type: 'error', message: 'Update operation rejected by access policy.' });
      }
    } catch (err) {
      console.error(err);
      setBannerNotice({ type: 'error', message: 'Network breakdown experienced during profile modification.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full max-h-full w-full flex flex-col justify-start overflow-hidden relative bg-white pb-4">
      
      {/* GLOBAL BANNER TOAST FLOATER */}
      {bannerNotice && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${
            bannerNotice.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' : 'bg-rose-50/90 border-rose-200 text-rose-800'
          }`}>
            {bannerNotice.message}
          </div>
        </div>
      )}

      {/* Structural Header Section */}
      <div className="mb-4 shrink-0 px-2">
        <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">Manage Accounts</h1>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
          Deploy credentials or modify user parameters seamlessly.
        </p>
      </div>

      {/* Tab Controls Menu */}
      <div className="flex border-b border-slate-200 gap-6 shrink-0 mb-4 px-2">
        <button
          type="button"
          onClick={() => { setActiveTab('create'); setCreateStatus(null); }}
          className={`pb-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer ${
            activeTab === 'create' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Provision Account
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`pb-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer ${
            activeTab === 'search' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Look Up Profiles
        </button>
      </div>

      {/* DYNAMIC SCROLL CONTAINER BLOCK */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 base-page-scroller">
        
        {/* VIEW 1: PROVISION NEW USER */}
        {activeTab === 'create' && (
          <div className="bg-slate-50/80 p-5 md:p-6 rounded-2xl border border-slate-200/60 shadow-sm max-w-2xl mx-auto w-full">
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">CNIC Number</label>
                  <input
                    type="text" required value={formData.cnic}
                    onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                    placeholder="61101-XXXXXXX-X"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Role Authorization</label>
                  <input
                    type="text" required value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., MANAGER, IAM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white uppercase focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Department Linkage</label>
                <select
                  required value={formData.departmentId}
                  onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                  disabled={isLoadingDepts}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 transition-all disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="">Choose department group node</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black tracking-widest text-white bg-green-600 hover:bg-green-700 transition-all uppercase shadow-md shadow-green-600/10 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  {isSubmitting ? 'Compiling Profile...' : 'Provision Corporate Account'}
                </button>
              </div>

              {createStatus && (
                <div className={`p-4 border rounded-xl text-xs font-bold uppercase tracking-wider mt-2 animate-in fade-in duration-200 ${
                  createStatus.type === 'success' ? 'bg-green-50/60 border-green-200 text-green-800' : 'bg-rose-50/60 border-rose-200 text-rose-700'
                }`}>
                  {createStatus.message}
                </div>
              )}
            </form>
          </div>
        )}

        {/* VIEW 2: SEARCH ARCHIVE DETAILED SCHEMATIC */}
        {activeTab === 'search' && (
          <div className="space-y-4 w-full">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto w-full">
              <input
                type="text" required value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Enter account profile name..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-green-600 transition-colors"
              />
              <button
                type="submit" disabled={isSearching}
                className="px-6 py-2 bg-green-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-green-700 transition-all uppercase shadow-md shadow-green-600/10 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Grid Scroller Frame To Contain Table Responsively Without Screen Spillover */}
            <div className="border border-slate-200/80 rounded-2xl overflow-x-auto bg-white shadow-sm max-w-5xl mx-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4">User Details</th>
                    <th className="p-4">CNIC</th>
                    <th className="p-4">Access Role</th>
                    <th className="p-4">Department</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        No corporate records matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    searchResults.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4">
                          <div className="font-black text-slate-900 uppercase text-xs tracking-tight">{user.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium tracking-normal lowercase mt-0.5">{user.email}</div>
                        </td>
                        <td className="p-4 font-mono text-slate-500 tracking-wider text-xs">{user.cnic}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider border bg-slate-50 border-slate-200 text-slate-500 uppercase">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-black text-slate-800 uppercase text-xs">{user.department?.name || 'Unassigned'}</div>
                          {user.department?.code && <div className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-0.5">{user.department.code}</div>}
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-green-600 hover:text-white transition rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-wider cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmation({ id: user.id, name: user.name })}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-100/70 transition rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY EDIT PARAMS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-xl p-5 md:p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Modify Security Parameters</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Target Operator: <span className="text-slate-700 font-black">{editingUser.name}</span>
              </p>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">System Security Role</label>
                <input
                  type="text" required value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white uppercase focus:outline-none focus:border-green-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Assigned Department Alignment</label>
                <select
                  required value={editDeptId}
                  onChange={e => setEditDeptId(e.target.value)}
                  disabled={isLoadingDepts}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 transition-all cursor-pointer"
                >
                  <option value="">-- Select Structural Group Node --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Override Passphrase (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-green-600 transition-all"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Leave blank to retain current active credential key.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 transition-all shadow-md shadow-green-600/10 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION INTERACTIVE DIALOG OVERLAY (Replaces Window Confirm Popup) */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl shadow-2xl p-5 md:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-black text-lg">!</div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Confirm Account Deletion</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                Are you sure you want to permanently drop <span className="text-rose-600 font-black">{deleteConfirmation.name}</span> from organizational active directories? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAccountDeletion}
                className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Confirm Drop
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}