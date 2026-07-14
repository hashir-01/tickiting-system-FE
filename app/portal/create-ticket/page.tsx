'use client';

import React, { useState, useEffect } from 'react';

interface DepartmentItem {
  id: number;
  name: string;
  code: string;
}

export default function CreateTicketPage() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    impact: 'MEDIUM',
    urgency: 'MEDIUM',
    resolvingDepartment: '', 
    resolverRole: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchLiveDepartments = async () => {
      try {
        const response = await fetch('http://localhost:3001/department'); 
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
          setDepartments(data);
        } else {
          console.error('Failed to parse departments list.');
        }
      } catch (err) {
        console.error('Network failure trying to contact backend:', err);
      } finally {
        setFetchingDepartments(false);
      }
    };

    fetchLiveDepartments();
  }, []);

  // ✅ Automatically clear resolverRole if the newly selected department doesn't support IAM
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      
      // If department changed, check if IAM is still valid
      if (name === 'resolvingDepartment') {
        const isSecOrIT = value === 'INF_SEC' || value === 'IT'; // 👈 Change codes here if your DB uses different strings
        if (!isSecOrIT && prev.resolverRole === 'IAM') {
          updatedData.resolverRole = ''; // Reset to auto-route if department doesn't match
        }
      }
      
      return updatedData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const loggedInUserId = localStorage.getItem('userId');    
    const loggedInUserRole = localStorage.getItem('userRole'); 
    const token = localStorage.getItem('token'); 

    try {
      const response = await fetch('http://localhost:3001/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...formData,
          creatorId: loggedInUserId ? Number(loggedInUserId) : undefined,
          creatorRole: loggedInUserRole || undefined,
          resolverRole: formData.resolverRole.trim() === '' ? undefined : formData.resolverRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong while creating your ticket.');
      }

      setStatusMessage({ 
        type: 'success', 
        text: `Ticket Created Successfully! Ticket ID: #${data.id}` 
      });
      
      setFormData({
        title: '',
        description: '',
        impact: 'MEDIUM',
        urgency: 'MEDIUM',
        resolvingDepartment: '',
        resolverRole: '',
      });
    } catch (error: any) {
      setStatusMessage({ type: 'error', text: error.message || 'Network connectivity error.' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Condition to check if Information Security or IT is selected
  const showIAMRole = formData.resolvingDepartment === 'INF_SEC' || formData.resolvingDepartment === 'IT';

  return (
    <div className="h-full w-full flex flex-col bg-white px-4 pb-4 overflow-hidden">
      
      {/* Dynamic Header Section */}
      <div className="mt-1 mb-2 shrink-0">
        <h1 className="text-lg font-black uppercase tracking-tight text-slate-900">
          Create Ticket
        </h1>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
          Log and route a new priority ticket inside the network.
        </p>
      </div>
      <br></br>
      {/* Zero Scroll Container Frame */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto base-page-scroller pt-1 pb-2">
        
        {/* Compact Form Card optimized for standard desktop & mobile limits */}
        <div className="bg-slate-50/80 p-4 md:p-5 rounded-xl border border-slate-200/60 shadow-sm max-w-2xl w-full">
          
          {/* Feedback Alerts Block */}
          {statusMessage && (
            <div className={`p-2.5 rounded-lg mb-2 text-[10px] font-bold uppercase tracking-wide border ${
              statusMessage.type === 'success' 
                ? 'bg-green-50/60 border-green-200 text-green-800' 
                : 'bg-rose-50/60 border-rose-200 text-rose-700'
            }`}>
              {statusMessage.type === 'success' ? '✅' : '⚠️'} {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Title Input */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Ticket Summary Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Global identity syncing service timeout error"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all"
              />
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Detailed Issue Description
              </label>
              <textarea
                name="description"
                required
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a precise overview log detail of the problem..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/20 transition-all resize-none"
              />
            </div>

            {/* Impact and Urgency Layout Splits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Impact Level
                </label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-green-600 transition-all"
                >
                  <option value="LOW">Low (Single Operator)</option>
                  <option value="MEDIUM">Medium (Complete Department)</option>
                  <option value="HIGH">High (Enterprise outage)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Urgency Level
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-green-600 transition-all"
                >
                  <option value="LOW">Low (Workaround operational)</option>
                  <option value="MEDIUM">Medium (Performance degraded)</option>
                  <option value="HIGH">High (Immediate response)</option>
                </select>
              </div>
            </div>

            {/* Department Selection Elements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Target Resolving Department
                </label>
                <select
                  name="resolvingDepartment"
                  required
                  value={formData.resolvingDepartment}
                  onChange={handleChange}
                  disabled={fetchingDepartments}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {fetchingDepartments ? 'Connecting to DB...' : 'Select Department'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.code}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Target Specialist Role (Optional)
                </label>
                <select
                  name="resolverRole"
                  value={formData.resolverRole}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-green-600 transition-all"
                >
                  <option value="">Auto-route (Any tier operator)</option>
                  {/* ✅ Dynamic Condition for IAM and permanently removed SUPER_ADMIN */}
                  {showIAMRole && <option value="IAM">IAM Tier Specialist</option>}
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={loading || fetchingDepartments}
                className="w-full sm:w-auto px-6 py-2 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-lg text-[10px] tracking-widest uppercase transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? 'Processing...' : 'Initialize Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}