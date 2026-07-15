'use client';
import React, { useEffect, useState } from 'react';

export default function AllDepartmentsProgressPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State yeh track karne ke liye ke kaun sa department khula hua hai
  const [expandedDeptId, setExpandedDeptId] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://ticketing-system-be-lkut.onrender.com/department-progress/all-departments')
      .then((res) => {
        if (!res.ok) throw new Error('Data load karne mein masla hua.');
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleDepartment = (id: number) => {
    setExpandedDeptId(expandedDeptId === id ? null : id);
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-600">Loading Organization Data...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">⚠️ Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-gray-900">🏢 Company-Wide Progress Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Reporting Period: <b className="text-blue-600">{data?.period}</b></p>
      </div>

      <div className="space-y-4">
        {data?.departments.map((dept: any) => {
          const isExpanded = expandedDeptId === dept.id;
          const dp = dept.performance;

          return (
            <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* 🏛️ DEPARTMENT HEADER ROW (Clickable) */}
              <div 
                onClick={() => toggleDepartment(dept.id)}
                className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-gray-50 cursor-pointer transition-all border-b border-gray-100"
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>{isExpanded ? '🔽' : '▶️'}</span>
                    {dept.name} <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{dept.code || `ID: ${dept.id}`}</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{dept.employees.length} Total Team Members</p>
                </div>

                {/* Quick Top-Level Metrics for Department */}
                <div className="grid grid-cols-4 gap-2 md:gap-4 text-center min-w-[320px] md:min-w-[450px]">
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="text-[10px] text-blue-600 uppercase font-bold block">Assigned</span>
                    <span className="text-md font-black text-blue-900">{dp.ticketsAssignedTotal}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <span className="text-[10px] text-green-600 uppercase font-bold block">Resolved</span>
                    <span className="text-md font-black text-green-900">{dp.ticketsResolvedTotal}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">In-Time</span>
                    <span className="text-md font-black text-emerald-900">{dp.closedInTimeTotal}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded">
                    <span className="text-[10px] text-amber-600 uppercase font-bold block">Active</span>
                    <span className="text-md font-black text-amber-900">{dp.currentWorkingTotal}</span>
                  </div>
                </div>
              </div>

              {/* 👥 EMPLOYEES DETAILS (Visible only when expanded) */}
              {isExpanded && (
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 animate-fadeIn">
                  {dept.employees.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-400 italic">Is department mein abhi koi employees maujood nahi hain.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border bg-white shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b">
                            <th className="p-3 pl-5">Team Member</th>
                            <th className="p-3">Role</th>
                            <th className="p-3 text-center">Tickets Assigned</th>
                            <th className="p-3 text-center">Tickets Closed</th>
                            <th className="p-3 text-center">Closed In-Time</th>
                            <th className="p-3 text-center">Current Workload</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm text-gray-600">
                          {dept.employees.map((emp: any) => (
                            <tr key={emp.info.id} className="hover:bg-gray-50/80">
                              <td className="p-3 pl-5 font-medium text-gray-900">{emp.info.name}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono uppercase">
                                  {emp.info.role}
                                </span>
                              </td>
                              <td className="p-3 text-center text-blue-600 font-semibold">{emp.metrics.ticketsAssignedTotal}</td>
                              <td className="p-3 text-center text-green-600 font-semibold">{emp.metrics.ticketsClosedTotal}</td>
                              <td className="p-3 text-center text-emerald-600">{emp.metrics.closedInTimeTotal}</td>
                              <td className="p-3 text-center font-bold text-gray-700">{emp.metrics.activeWorkloadTotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}