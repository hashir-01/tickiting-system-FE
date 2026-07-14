'use client';

import React, { useState, useEffect } from 'react';

interface Department {
  id: string; // or number, depending on your DB configuration
  name: string;
  code: string;
}

export default function ManageDepartmentsPage() {
  // Lists and Data states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states: Create Department
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form states: Delete Department
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 🔄 Fetch all current departments for the selection dropdown
  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:3001/department', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed fetching departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // ➕ Action: Handle Create Department
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setIsCreating(true);

    try {
      const res = await fetch('http://localhost:3001/department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: newName, code: newCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create department.');
      }

      setCreateSuccess(`Successfully created ${data.name}!`);
      setNewName('');
      setNewCode('');
      
      // Refresh list so the dropdown syncs automatically
      fetchDepartments();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // ❌ Action: Handle Delete Department
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      setDeleteError('Please select a department to delete.');
      return;
    }

    if (!confirm('Are you absolutely sure you want to delete this department? This cannot be undone.')) {
      return;
    }

    setDeleteError('');
    setDeleteSuccess('');
    setIsDeleting(true);

    try {
      const res = await fetch(`http://localhost:3001/department/${selectedDeptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete department.');
      }

      setDeleteSuccess('Department permanently deleted.');
      setSelectedDeptId('');
      
      // Refresh list to pull deleted row out of the dropdown selection state
      fetchDepartments();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Dynamic Header Workspace */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-slate-950">
          Manage Departments
        </h1>
        <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">
          Provision infrastructure departments or clean up dormant structural organizations.
        </p>
      </div>

      <hr className="border-slate-200" />

      {/* Grid containing both actions side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 🏢 CARD 1: CREATE DEPARTMENT */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
              <span>➕</span> Create New Department
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="deptName" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Department Name
                </label>
                <input
                  id="deptName"
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Information Technology"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 bg-white text-sm font-medium"
                />
              </div>

              <div>
                <label htmlFor="deptCode" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Department Short Code
                </label>
                <input
                  id="deptCode"
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g., IT"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition text-slate-900 bg-white text-sm font-medium uppercase"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider text-white bg-slate-950 hover:bg-emerald-600 focus:outline-none transition-colors duration-150 disabled:opacity-50 uppercase shadow-sm"
                >
                  {isCreating ? 'Provisioning...' : 'Provision Department'}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback Blocks */}
          <div className="mt-4">
            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium text-center">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-700 font-medium text-center">
                {createSuccess}
              </div>
            )}
          </div>
        </div>

        {/* 🗑️ CARD 2: DELETE DEPARTMENT */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-6 flex items-center gap-2">
              <span>🗑️</span> Remove Department
            </h2>

            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label htmlFor="deleteSelect" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Select Target Department
                </label>
                <select
                  id="deleteSelect"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  disabled={isLoading}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition text-slate-900 bg-white text-sm font-medium disabled:opacity-50"
                >
                  <option value="">-- Choose target department to drop --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDeleting || !selectedDeptId || isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider text-white bg-rose-950 hover:bg-rose-700 focus:outline-none transition-colors duration-150 disabled:opacity-30 uppercase shadow-sm"
                >
                  {isDeleting ? 'Deprovisioning...' : 'Deprovision Department'}
                </button>
              </div>
            </form>
          </div>

          {/* Feedback Blocks */}
          <div className="mt-4">
            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-medium text-center">
                {deleteError}
              </div>
            )}
            {deleteSuccess && (
              <div className="p-3 bg-slate-900 border border-slate-950 rounded-xl text-[11px] text-emerald-400 font-bold text-center">
                {deleteSuccess}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}