'use client';

import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Ticket, CheckCircle, AlertTriangle, Clock, Zap } from 'lucide-react';

interface PerformanceData {
  ticketsAssignedTotal: number;
  assignedCriticalCount: number;
  assignedHighCount: number;
  assignedMediumCount: number;
  assignedLowCount: number;
  ticketsClosedTotal: number;
  closedInTimeTotal: number;
  closedAfterDeadline: number;
  activeWorkloadTotal: number;
  activeWorkloadBreached: number;
  inTimeCriticalCount: number;
  inTimeHighCount: number;
  inTimeMediumCount: number;
  inTimeLowCount: number;
  afterDeadlineCriticalCount: number;
  afterDeadlineHighCount: number;
  afterDeadlineMediumCount: number;
  afterDeadlineLowCount: number;
  period: string;
}

export default function MyPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loggedInUser = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const employeeId = loggedInUser ? Number(loggedInUser) : 1; 

    fetch(`https://ticketing-system-be-lkut.onrender.com/employee-performance/my-metrics?employeeId=${employeeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server execution error status code: ${res.status}`);
        }
        return res.json();
      })
      .then((parsedJsonData) => {
        setData(parsedJsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard metrics data:', err);
        setErrorMessage(err.message || 'Performance data load nahi kiya ja saka.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white text-slate-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white text-slate-900 p-4 text-center">
        <div>
          <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-bounce" />
          <p className="text-lg text-slate-700 max-w-md">
            {errorMessage || 'Performance analytics metrics data load nahi kiya ja saka.'}
          </p>
        </div>
      </div>
    );
  }

  const priorityDistribution = [
    { name: 'Critical', value: data.assignedCriticalCount, color: '#ef4444' },
    { name: 'High', value: data.assignedHighCount, color: '#f97316' },
    { name: 'Medium', value: data.assignedMediumCount, color: '#3b82f6' },
    { name: 'Low', value: data.assignedLowCount, color: '#10b981' },
  ].filter(item => item.value > 0);

  const priorityCompareData = [
    { name: 'Critical', 'In Time': data.inTimeCriticalCount, 'Breached': data.afterDeadlineCriticalCount },
    { name: 'High', 'In Time': data.inTimeHighCount, 'Breached': data.afterDeadlineHighCount },
    { name: 'Medium', 'In Time': data.inTimeMediumCount, 'Breached': data.afterDeadlineMediumCount },
    { name: 'Low', 'In Time': data.inTimeLowCount, 'Breached': data.afterDeadlineLowCount },
  ];

  const slaPercentage = data.ticketsClosedTotal > 0 
    ? Math.round((data.closedInTimeTotal / data.ticketsClosedTotal) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-10">
      
      {/* Header section with clean light mode design */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            My Performance Analytics
          </h1>
          
        </div>
        
      </div>

      {/* Cards Grid - Light Mode */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Assigned Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 hover:border-indigo-500 transition-all duration-300 group shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Total Tickets Handled</p>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 group-hover:scale-110 transition-transform"><Ticket className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-4xl font-black text-slate-900">{data.ticketsAssignedTotal}</p>
        </div>

        {/* Closed Total Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 hover:border-emerald-500 transition-all duration-300 group shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Resolved Total</p>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 group-hover:scale-110 transition-transform"><CheckCircle className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-4xl font-black text-slate-900">{data.ticketsClosedTotal}</p>
        </div>

        {/* Active Workload Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 hover:border-amber-500 transition-all duration-300 group shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Current Backlog / Active</p>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 group-hover:scale-110 transition-transform"><Clock className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-4xl font-black text-slate-900">{data.activeWorkloadTotal}</p>
        </div>

        {/* Breached Workload Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200 hover:border-rose-500 transition-all duration-300 group shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Active Breached</p>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 group-hover:scale-110 transition-transform"><AlertTriangle className="h-5 w-5" /></div>
          </div>
          <p className="mt-4 text-4xl font-black text-rose-600">{data.activeWorkloadBreached}</p>
        </div>
      </div>

      {/* Charts Section - Light Theme */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Chart 1: Priority Volume Allocation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-1 shadow-sm">
          <h3 className="text-xs font-bold tracking-wide text-slate-600 uppercase mb-4">Priority Contribution</h3>
          <div className="flex h-64 items-center justify-center">
            {priorityDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {priorityDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#475569', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">Koi tickets assigned nahi hain.</p>
            )}
          </div>
        </div>

        {/* Chart 2: SLA Closed Performance Analysis */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2 shadow-sm">
          <h3 className="text-xs font-bold tracking-wide text-slate-600 uppercase mb-4">Resolution SLA Pipeline Splits</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityCompareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="In Time" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Breached" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Granular Audit Table - Light Theme */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Granular Priority Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-slate-500">Metric Priority</th>
                <th className="px-6 py-4 text-slate-500">Assigned Total</th>
                <th className="px-6 py-4 text-slate-500">Closed In-Time</th>
                <th className="px-6 py-4 text-slate-500">Closed After Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-transparent">
              {/* Critical Metric Row */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-rose-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Critical
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">{data.assignedCriticalCount}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+{data.inTimeCriticalCount}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">-{data.afterDeadlineCriticalCount}</td>
              </tr>
              {/* High Metric Row */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-orange-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span> High
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">{data.assignedHighCount}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+{data.inTimeHighCount}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">-{data.afterDeadlineHighCount}</td>
              </tr>
              {/* Medium Metric Row */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-blue-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span> Medium
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">{data.assignedMediumCount}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+{data.inTimeMediumCount}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">-{data.afterDeadlineMediumCount}</td>
              </tr>
              {/* Low Metric Row */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-emerald-600 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Low
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">{data.assignedLowCount}</td>
                <td className="px-6 py-4 text-emerald-600 font-medium">+{data.inTimeLowCount}</td>
                <td className="px-6 py-4 text-rose-600 font-medium">-{data.afterDeadlineLowCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}