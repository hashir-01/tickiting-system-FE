'use client';
import React, { useEffect, useState } from 'react';

export default function ManagerViewProgressPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 💡 Jaise employee view ke waqt logged-in user ki ID uthate hain:
    const loggedInUser = localStorage.getItem('userId'); // Ya jo bhi key aapke setup mein hai

    if (!loggedInUser) {
      setError("Logged in user ki ID nahi mili. Pehle login karein.");
      setLoading(false);
      return;
    }

    // Port 3001 par target user ki identity query param mein send kar di
    fetch(`https://ticketing-system-be-lkut.onrender.com/department-progress/manager-analytics?userId=${loggedInUser}`)
      .then((res) => {
        if (!res.ok) throw new Error('Department data load karne mein masla hua.');
        return res.json();
      })
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center font-bold">Data load ho raha hai...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">⚠️ {error}</div>;
  if (!analytics) return null;

  const dp = analytics.departmentPerformance;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          🏢 {analytics.department.name} Performance Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Reporting Period: <b>{analytics.period}</b></p>
      </div>

      {/* --- OVERALL SUMMARY --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Overall Department Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <span className="text-xs text-blue-600 font-semibold block uppercase">Total Assigned</span>
            <span className="text-2xl font-black text-blue-900">{dp.ticketsAssignedTotal}</span>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <span className="text-xs text-green-600 font-semibold block uppercase">Total Resolved</span>
            <span className="text-2xl font-black text-green-900">{dp.ticketsResolvedTotal}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <span className="text-xs text-emerald-600 font-semibold block uppercase">Resolved In-Time</span>
            <span className="text-2xl font-black text-emerald-900">{dp.closedInTimeTotal}</span>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <span className="text-xs text-amber-600 font-semibold block uppercase">Active Workload</span>
            <span className="text-2xl font-black text-amber-900">
              {dp.currentWorkingTotal} <span className="text-sm text-red-600">({dp.currentWorkingBreachedTotal})</span>
            </span>
          </div>
        </div>
      </div>

      {/* --- EMPLOYEE BREAKDOWN TABLE --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Team Members Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-bold border-b">
                <th className="p-4">Employee</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Assigned</th>
                <th className="p-4 text-center">Closed</th>
                <th className="p-4 text-center">In-Time</th>
                <th className="p-4 text-center">Late</th>
                <th className="p-4 text-center">Current Load (Breached)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm text-gray-600">
              {analytics.employeePerformances.map((emp: any) => (
                <tr key={emp.employeeInfo.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-gray-900">{emp.employeeInfo.name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-gray-200 text-xs rounded font-mono">{emp.employeeInfo.role}</span></td>
                  <td className="p-4 text-center font-bold text-blue-600">{emp.metrics.ticketsAssignedTotal}</td>
                  <td className="p-4 text-center font-bold text-green-600">{emp.metrics.ticketsClosedTotal}</td>
                  <td className="p-4 text-center text-emerald-600 font-semibold">{emp.metrics.closedInTimeTotal}</td>
                  <td className="p-4 text-center text-red-500 font-semibold">{emp.metrics.closedAfterDeadline}</td>
                  <td className="p-4 text-center">
                    <span className="font-bold">{emp.metrics.activeWorkloadTotal}</span> 
                    <span className="text-xs text-red-600 font-bold ml-1">({emp.metrics.activeWorkloadBreached})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}