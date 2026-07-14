'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';

// ✅ Interfaces fully mapped with your custom relational Postgres data layers
interface Ticket {
  id: number;
  title: string;
  description: string;
  impact: string;
  urgency: string;
  status: string;
  createdAt: string;
  deadlineAt: string; 
  resolvingDepartment: string;
  priority?: string;
  currentAssignedToId?: number | null; // 🛡️ Tracking parameter for control permissions check
  createdBy?: { 
    name: string; 
    role: string;
    department?: { name: string; code: string }
  };
}

interface Comment {
  id: number;
  body: string;
  createdAt: string;
  author: { name: string; role: string };
}

// ⏳ Component Helper: Standard countdown ticker logic
function ActiveDeadlineCounter({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft('🚨 SLA BREACHED (OVERDUE)');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let segments = [];
      if (days > 0) segments.push(`${days}d`);
      if (hours > 0 || days > 0) segments.push(`${hours}h`);
      segments.push(`${minutes}m`);
      segments.push(`${seconds}s`);

      setTimeLeft(`⏳ ${segments.join(' ')} remaining`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className={`text-[11px] font-black tracking-wide ${timeLeft.includes('BREACHED') ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`}>
      {timeLeft}
    </span>
  );
}

export default function PendingActionsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Filtering & UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'date'>('urgency');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  // 🔮 Modals & Advanced Workflow Engine States
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignType, setReassignType] = useState<'SAME_DEPT' | 'OTHER_DEPT'>('SAME_DEPT');
  const [departments, setDepartments] = useState<{ id: number; name: string; code: string }[]>([]);
  const [deptUsers, setDeptUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | string>('');
  const [userSearchText, setUserSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'MY_QUEUE' | 'ALL_HISTORY'>('MY_QUEUE');

  const [showForwardModal, setShowForwardModal] = useState(false);
  
  // Custom Shadcn Dialog Fallbacks (100% English UI texts)
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionType: 'REVERT' | 'RESOLVE' | null;
  }>({ show: false, title: '', message: '', actionType: null });

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Local Context Tracking Fallbacks
  const currentUserId = Number(typeof window !== 'undefined' ? localStorage.getItem('userId') : '6') || 6;

  // Auto clear status updates
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    fetchTickets();
  }, []);

  // 📥 Fetch Active Queue Node from tickets/pending
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole') || 'IAM';

      const res = await fetch('http://localhost:3001/tickets/pending', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-user-id': String(currentUserId),
          'x-user-role': userRole
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        
        if (selectedTicket) {
          const freshTicket = data.find((t: Ticket) => t.id === selectedTicket.id);
          if (freshTicket) setSelectedTicket(freshTicket);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard queue:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // 🔍 Load comments whenever a ticket is clicked
  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setComments([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/tickets/${ticket.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed processing server thread logs:', err);
    }
  };

  // ✍️ Post comment function 
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket) return;
    setSubmittingComment(true);

    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:3001/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': String(currentUserId)
        },
        body: JSON.stringify({ text: newComment }) 
      });

      if (!res.ok) throw new Error(`Server error context: ${res.status}`);

      const freshComment = await res.json();
      setComments((prev) => [...prev, freshComment]);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: `Comment Error: ${err.message}`, type: 'error' });
    } finally {
      setSubmittingComment(false);
    }
  };

  // ⚙️ Toggle In Progress / Stop Progress (No Alert Layout)
  const handleToggleProgress = async (ticketId: number, triggerStatus: string) => {
    try {
      const activeUserId = Number(localStorage.getItem('userId')) || 6; 

      const response = await fetch(`http://localhost:3001/tickets/${ticketId}/toggle-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentStatus: triggerStatus,
          userId: activeUserId
        }),
      });

      if (!response.ok) throw new Error('API processing failed');
      
      setStatusMessage({ 
        text: triggerStatus === 'IN_PROGRESS' ? 'Progress suspended.' : 'Ticket state set to active progress.', 
        type: 'info' 
      });
      fetchTickets(); 
    } catch (error) {
      console.error("Error updating ticket workflow phase state:", error);
      setStatusMessage({ text: "Pipeline progress processing failed.", type: 'error' });
    }
  };

  // Trigger Shadcn Confirmation Dialog for Revert
  const triggerRevertConfirm = () => {
    setConfirmDialog({
      show: true,
      title: 'Are you absolutely sure?',
      message: 'This action will revert the ticket status back to its previous step in the system workflow route.',
      actionType: 'REVERT'
    });
  };

  // Trigger Shadcn Confirmation Dialog for Resolve
  const triggerResolveConfirm = () => {
    setConfirmDialog({
      show: true,
      title: 'Mark as Resolved',
      message: 'Are you sure you want to change this inbound element pipeline status to RESOLVED?',
      actionType: 'RESOLVE'
    });
  };

  const handleDialogConfirm = () => {
    const type = confirmDialog.actionType;
    setConfirmDialog(prev => ({ ...prev, show: false }));
    if (type === 'REVERT') executeRevert();
    if (type === 'RESOLVE') executeMarkAsResolved();
  };

  // ⏮️ Action Engine: Revert Execution
  const executeRevert = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3001/tickets/${selectedTicket.id}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clickerId: currentUserId }),
      });

      if (res.ok) {
        setStatusMessage({ text: 'Ticket successfully reverted.', type: 'success' });
        setSelectedTicket(null); 
        fetchTickets(); 
      } else {
        const errData = await res.json();
        setStatusMessage({ text: `Revert failed: ${errData.message}`, type: 'error' });
      }
    } catch (err) {
      console.error('Error executing revert route:', err);
    }
  };

  // ✅ Action Engine: Mark ticket status as RESOLVED
  const executeMarkAsResolved = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3001/tickets/${selectedTicket.id}/toggle-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStatus: 'RESOLVED_TRIGGER' }), 
      });

      if (!res.ok) throw new Error('API rejection');
      
      setStatusMessage({ text: 'Ticket marked as RESOLVED successfully!', type: 'success' });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error('Failed processing resolution pipeline change:', err);
    }
  };

  // 👤 Action Engine: Reassign Modal Data Fetchers
  const openReassignModal = async () => {
    setShowReassignModal(true);
    setReassignType('SAME_DEPT');
    setSelectedDept('');
    setSelectedUser('');
    setUserSearchText('');
    try {
      const dRes = await fetch('http://localhost:3001/tickets/meta/departments');
      if (dRes.ok) setDepartments(await dRes.json());
      
      const uRes = await fetch(`http://localhost:3001/tickets/meta/dept-users/${currentUserId}`);
      if (uRes.ok) setDeptUsers(await uRes.json());
    } catch (err) {
      console.error('Metadata context aggregation failed:', err);
    }
  };

  const executeReassign = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`http://localhost:3001/tickets/${selectedTicket.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clickerId: currentUserId,
          type: reassignType,
          deptCode: reassignType === 'OTHER_DEPT' ? selectedDept : undefined,
          targetUserId: reassignType === 'SAME_DEPT' ? Number(selectedUser) : undefined,
        }),
      });

      if (res.ok) {
        setStatusMessage({ text: 'Ticket reassigned successfully!', type: 'success' });
        setShowReassignModal(false);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        const errData = await res.json();
        setStatusMessage({ text: `Routing error: ${errData.message}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ➡️ Action Engine: Forward Workflow Execution
  const openForwardModal = async () => {
    setShowForwardModal(true);
    setSelectedUser('');
    setUserSearchText('');
    try {
      const uRes = await fetch(`http://localhost:3001/tickets/meta/dept-users/${currentUserId}`);
      if (uRes.ok) setDeptUsers(await uRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const executeForward = async () => {
    if (!selectedTicket || !selectedUser) return;
    try {
      const res = await fetch(`http://localhost:3001/tickets/${selectedTicket.id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwarderId: currentUserId,
          targetUserId: Number(selectedUser),
        }),
      });

      if (res.ok) {
        setStatusMessage({ text: 'Ticket forwarded successfully!', type: 'success' });
        setShowForwardModal(false);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        const errData = await res.json();
        setStatusMessage({ text: `Forward Error: ${errData.message}`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Search Filters & Priority Weights Execution
  const filteredTickets = tickets
    .filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'MY_QUEUE') {
        return t.currentAssignedToId === currentUserId && t.status !== 'RESOLVED' && t.status !== 'CLOSED';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const weight: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (weight[b.urgency] || 0) - (weight[a.urgency] || 0);
    });

  const filteredUsers = deptUsers.filter(u => u.name.toLowerCase().includes(userSearchText.toLowerCase()));
  const isCurrentResolver = selectedTicket ? selectedTicket.currentAssignedToId === currentUserId : false;

  return (
    <div className="h-full min-h-0 max-h-[calc(100vh-6.5rem)] w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row overflow-hidden antialiased relative shadow-sm">
      
      {/* 🔔 SHADCN-STYLE FLOATING RADAR TOAST NOTIFICATION */}
      {statusMessage && (
        <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 max-w-sm w-full duration-200">
          <div className={`p-3 rounded-xl flex items-center gap-3 border shadow-xl bg-white text-left ${
            statusMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50/50' : statusMessage.type === 'error' ? 'border-rose-200 bg-rose-50/50' : 'border-blue-200 bg-blue-50/50'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />}
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase text-slate-900 tracking-wide">System Notification</p>
              <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-tight">{statusMessage.text}</p>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 📊 COLUMN 1: QUEUE PANELS (LEFT) */}
      <div className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex flex-col h-full ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Assigned Inbound</h2>
            <select 
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="urgency">Sort: Priority</option>
              <option value="date">Sort: Timeline</option>
            </select>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/40">
            <button
              type="button"
              onClick={() => setActiveTab('MY_QUEUE')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'MY_QUEUE' ? 'bg-white text-green-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Current Tickets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL_HISTORY')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'ALL_HISTORY' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Tickets
            </button>
          </div>

          <input 
            type="text"
            placeholder="Search matching keys..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-600 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingTickets ? (
            <div className="p-4 text-center text-xs font-bold uppercase text-slate-400 animate-pulse">Syncing Active Queue Node...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold uppercase text-slate-400">Queue completely clear</div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                className={`p-4 cursor-pointer text-left transition-all ${selectedTicket?.id === ticket.id ? 'bg-slate-50 border-l-4 border-green-600' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold text-slate-900 truncate block w-[68%]">{ticket.title}</span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide border shrink-0 ${
                    ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {ticket.priority || 'LOW'}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>By: <b className="text-slate-700 font-semibold">{ticket.createdBy?.name || 'Agent'}</b></span>
                    {ticket.currentAssignedToId !== currentUserId && (
                      <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold px-1 rounded">FORWARDED OUT</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Due:</span>
                      <span className="font-medium text-slate-600">
                        {new Date(ticket.deadlineAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {activeTab === 'ALL_HISTORY' && (
                      <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                        ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : ticket.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ticket.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🔍 COLUMN 2 & 3 CONTAINER FOR MOBILE VIEW MANAGEMENT */}
      <div className={`w-full md:w-2/3 flex flex-col md:flex-row h-full overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        
        {/* MIDDLE OPERATIONS CARD NODE */}
        <div className="w-full md:w-1/2 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden">
          {selectedTicket && (
            <div className="p-4 flex flex-col h-full justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="md:hidden flex items-center gap-1 text-[10px] text-slate-500 font-black uppercase mb-2 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Close Details
                </button>
                <div>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Ticket Specification</span>
                  <h1 className="text-sm font-black text-slate-900 mt-0.5 truncate">{selectedTicket.title}</h1>
                </div>

                {(!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-left">
                    <span className="text-[10px] font-black text-rose-700 block uppercase tracking-wide">🛡️ Operations Locked</span>
                    <p className="text-[10px] text-rose-600 leading-normal mt-0.5">
                      {selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                        ? `This ticket is already marked as ${selectedTicket.status}. Modifications or comments are disabled.`
                        : "You have either forwarded/reassigned this ticket or it is not assigned to your current user node. Actions are locked."}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution SLA</span>
                  <ActiveDeadlineCounter targetDate={selectedTicket.deadlineAt} />
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-200/60 pb-2">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Ticket Creator</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">{selectedTicket.createdBy?.name || 'System Operator'}</span>
                      <span className="block text-[9px] text-slate-400 italic">({selectedTicket.createdBy?.role || 'User'})</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Creator Dept</span>
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {selectedTicket.createdBy?.department?.name || selectedTicket.resolvingDepartment || 'General Operations'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Created Timestamp</span>
                    <span className="text-xs font-medium text-slate-700">
                      {new Date(selectedTicket.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Workflow Status</span>
                    <span className="inline-block mt-0.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-700">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Functional Manifest</span>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed mt-0.5 max-h-[100px] overflow-y-auto">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION LAYOUT ENGINE GRID */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 bg-white shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                    onClick={() => handleToggleProgress(selectedTicket.id, selectedTicket.status)}
                    className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      (!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED')
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                        : selectedTicket.status === 'IN_PROGRESS' ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    {selectedTicket.status === 'IN_PROGRESS' ? '⏹️ Stop Progress' : '⚙️ Mark In Progress'}
                  </button>
                  <button 
                    type="button"
                    disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                    onClick={openReassignModal}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    👤 Reassign
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                    onClick={openForwardModal}
                    className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➡️ Forward
                  </button>
                  <button 
                    type="button"
                    disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                    onClick={triggerRevertConfirm}
                    className="w-full py-2 bg-white hover:bg-slate-50 text-amber-600 border border-amber-300 rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⏮️ Revert
                  </button>
                </div>
                <button 
                  type="button"
                  disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                  onClick={triggerResolveConfirm}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Mark as Resolved
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 💬 COLUMN 3: COMMENT TELEMETRY TRAILS */}
        <div className="w-full md:w-1/2 bg-slate-50/50 flex flex-col h-full justify-between border-t md:border-t-0 border-slate-200">
          {selectedTicket && (
            <>
              <div className="p-4 bg-white border-b border-slate-200 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">Communication Audit Trail</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-left">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-[11px] font-medium text-slate-400">No telemetry comments logged.</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-900">{comment.author?.name || 'System Operator'}</span>
                        <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-widest">{comment.author?.role || 'AGENT'}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{comment.body}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handlePostComment} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'}
                  placeholder={isCurrentResolver && selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? "Type operational log comment..." : "Locked: Comments disabled"}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-600 bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!isCurrentResolver || selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED' || submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                >
                  {submittingComment ? '...' : 'Post'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* 🔮 SHADCN DIALOG PRIMITIVE FOR ACTION CONFIRMATIONS */}
      {confirmDialog.show && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-xl border p-4 max-w-sm w-full space-y-3 shadow-xl text-left animate-in zoom-in-95 duration-100">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">{confirmDialog.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-[10px] font-bold pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))} 
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg uppercase hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDialogConfirm} 
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg uppercase tracking-wider"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 MODAL 1: REASSIGN INTERFACE */}
      {showReassignModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border p-5 max-w-sm w-full space-y-4 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Reassign Routing Workflow</h3>
            <div className="flex gap-2 border-b pb-2">
              <button 
                type="button"
                onClick={() => { setReassignType('SAME_DEPT'); setSelectedUser(''); }} 
                className={`text-[10px] px-3 py-1 font-bold rounded-lg border transition-all ${reassignType === 'SAME_DEPT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                Same Department
              </button>
              <button 
                type="button"
                onClick={() => { setReassignType('OTHER_DEPT'); setSelectedDept(''); }} 
                className={`text-[10px] px-3 py-1 font-bold rounded-lg border transition-all ${reassignType === 'OTHER_DEPT' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                Cross Department
              </button>
            </div>

            {reassignType === 'OTHER_DEPT' ? (
              <select 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)} 
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-600"
              >
                <option value="">Select Target Department...</option>
                {departments.map(d => <option key={d.id} value={d.code}>{d.name} ({d.code})</option>)}
              </select>
            ) : (
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Type to filter matching name..." 
                  value={userSearchText} 
                  onChange={e => setUserSearchText(e.target.value)} 
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" 
                />
                <select 
                  value={selectedUser} 
                  onChange={e => setSelectedUser(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">Select Department Peer...</option>
                  {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name} [{u.role}]</option>)}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 text-[10px] font-bold pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowReassignModal(false)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg uppercase hover:bg-slate-50">Cancel</button>
              <button 
                type="button" 
                onClick={executeReassign} 
                disabled={(reassignType === 'OTHER_DEPT' && !selectedDept) || (reassignType === 'SAME_DEPT' && !selectedUser)}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg uppercase disabled:opacity-40 disabled:pointer-events-none"
              >
                Confirm Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 MODAL 2: FORWARD INTERFACE */}
      {showForwardModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border p-5 max-w-sm w-full space-y-4 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Forward Department Workflow</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Forward tickets instantly within your immediate department loop.</p>
            </div>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Search team member name..." 
                value={userSearchText} 
                onChange={e => setUserSearchText(e.target.value)} 
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none" 
              />
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)} 
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="">Choose department handler...</option>
                {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 text-[10px] font-bold pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowForwardModal(false)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg uppercase hover:bg-slate-50">Cancel</button>
              <button 
                type="button" 
                onClick={executeForward} 
                disabled={!selectedUser}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg uppercase disabled:opacity-40 disabled:pointer-events-none"
              >
                Forward Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}