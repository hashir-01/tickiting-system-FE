'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';

// ✅ Updated interface to match your exact Prisma include layer ('currentAssignedTo')
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
  expectedResolveMinutes: number;
  priority?: string;
  currentAssignedTo?: { // 👈 Fixed name here
    id: number;
    name: string;
    role: string;
  } | null;
}

interface Comment {
  id: number;
  body: string;
  createdAt: string;
  author: { name: string; role: string };
}

function ActionDeadlineCounter({ targetDate }: { targetDate: string }) {
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
    <span className={`text-[10px] sm:text-[11px] font-black tracking-wide ${timeLeft.includes('BREACHED') ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`}>
      {timeLeft}
    </span>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const [reopeningTicket, setReopeningTicket] = useState(false); 

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionType: 'CLOSE' | 'REOPEN' | null;
  }>({ show: false, title: '', message: '', actionType: null });

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    fetchMyCreatedTickets();
  }, []);

  const fetchMyCreatedTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || '6'; 
      
      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/tickets/my-creations?userId=${userId}`, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : ''
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
      console.error('Error compiling user tracking stream logs:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setComments([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/tickets/${ticket.id}/comments`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed syncing live comment metrics context:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    /* ✅ FIXED: Wapas sahi function parameter context call set kar diya hai */
    e.preventDefault();
    if (!newComment.trim() || !selectedTicket || selectedTicket.status === 'CLOSED') return;
    setSubmittingComment(true);

    try {
      const token = localStorage.getItem('token');
      const currentUserId = localStorage.getItem('userId') || '6';

      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-id': currentUserId 
        },
        body: JSON.stringify({ text: newComment }) 
      });

      if (!res.ok) throw new Error(`Thread sync processing abort code: ${res.status}`);

      const freshComment = await res.json();
      setComments((prev) => [...prev, freshComment]);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Failed logging comment message to audit trail.', type: 'error' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const triggerCloseConfirm = () => {
    if (!selectedTicket) return;
    setConfirmDialog({
      show: true,
      title: 'Permanently Close Ticket?',
      message: 'Are you sure you want to transition this issue node into a permanently closed architecture state?',
      actionType: 'CLOSE'
    });
  };

  const triggerReopenConfirm = () => {
    if (!selectedTicket) return;
    setConfirmDialog({
      show: true,
      title: 'Reopen Active Pipeline?',
      message: 'Was this item incorrectly processed? Reopening will place this record back into active operation queues.',
      actionType: 'REOPEN'
    });
  };

  const handleDialogConfirm = () => {
    const type = confirmDialog.actionType;
    setConfirmDialog(prev => ({ ...prev, show: false }));
    if (type === 'CLOSE') executeCloseTicket();
    if (type === 'REOPEN') executeReopenTicket();
  };

  const executeCloseTicket = async () => {
    if (!selectedTicket) return;
    setClosingTicket(true);

    try {
      const token = localStorage.getItem('token');
      const currentUserId = localStorage.getItem('userId') || '6';

      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/tickets/${selectedTicket.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ clickerId: Number(currentUserId) })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setStatusMessage({ text: 'Ticket successfully locked and closed.', type: 'success' });
        handleSelectTicket(updated);
      } else {
        setStatusMessage({ text: 'System tracking error occurred while trying to close this item.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClosingTicket(false);
    }
  };

  const executeReopenTicket = async () => {
    if (!selectedTicket) return;
    setReopeningTicket(true);

    try {
      const token = localStorage.getItem('token');
      const currentUserId = localStorage.getItem('userId') || '6';

      const res = await fetch(`https://ticketing-system-be-lkut.onrender.com/tickets/${selectedTicket.id}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ clickerId: Number(currentUserId) })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setStatusMessage({ text: 'Ticket pipeline re-activated into operation queues.', type: 'info' });
        handleSelectTicket(updated);
      } else {
        setStatusMessage({ text: 'Routing system failed to re-open the requested item.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReopeningTicket(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    /* ✅ FIXED CORE HEIGHT CONTAINER: Changed h-[calc(100vh-5.5rem)] to max-h-[calc(100vh-6.5rem)] */
    <div className="h-full min-h-0 max-h-[calc(100vh-6.5rem)] w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row overflow-hidden antialiased relative shadow-sm">
      
      {statusMessage && (
        <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 max-w-sm w-full duration-200">
          <div className={`p-3 rounded-xl flex items-center gap-3 border shadow-xl bg-white text-left ${
            statusMessage.type === 'success' ? 'border-emerald-200 bg-emerald-50/50' : statusMessage.type === 'error' ? 'border-rose-200 bg-rose-50/50' : 'border-blue-200 bg-blue-50/50'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />}
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase text-slate-900 tracking-wide">System Update</p>
              <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-tight">{statusMessage.text}</p>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 📊 COLUMN 1: QUEUE (LEFT) */}
      <div className={`w-full md:w-2/5 border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">My Raised Tickets</h2>
            <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wide">
              Total: {filteredTickets.length}
            </span>
          </div>
          <input 
            type="text"
            placeholder="Search my logged entries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-green-600 transition-colors"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 base-page-scroller">
          {loadingTickets ? (
            <div className="p-4 text-center text-xs font-bold uppercase text-slate-400 animate-pulse">Assembling logged items...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold uppercase text-slate-400">No matching tickets indexed</div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                className={`p-3.5 cursor-pointer text-left transition-all ${selectedTicket?.id === ticket.id ? 'bg-slate-50 border-l-4 border-green-600' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex justify-between items-start gap-3">
                  <span className="text-xs font-bold text-slate-900 truncate block w-[70%]">{ticket.title}</span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide border shrink-0 ${
                    ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : ticket.priority === 'MEDIUM' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {ticket.priority || 'LOW'}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-extrabold uppercase px-1.5 py-0.2 text-[8px] rounded border ${
                      ticket.status === 'CLOSED'
                        ? 'bg-rose-600 border-rose-700 text-white shadow-sm font-black' 
                        : ticket.status === 'RESOLVED' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                          : ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="text-right truncate max-w-[50%]">
                    <span className="text-slate-400">Assignee: </span>
                    <b className="text-slate-700 font-semibold truncate">
                      {ticket.currentAssignedTo?.name || 'Pending routing...'}
                    </b>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🔍 COLUMN 2: SUMMARY & DETAILS (RIGHT) */}
      <div className={`w-full md:w-3/5 bg-slate-50/50 flex flex-col h-full overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
        {selectedTicket ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-3 shrink-0 text-left">
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="md:hidden flex items-center gap-1 text-[9px] text-slate-500 font-black uppercase mb-1 border border-slate-200 rounded-lg px-2 py-1 w-fit bg-slate-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Queue
                </button>
                <span className="text-[8px] font-black text-green-600 uppercase tracking-widest block">Operational Core Data</span>
                <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">{selectedTicket.title}</h1>
                <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-[60px] overflow-y-auto pr-1 base-page-scroller">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 pt-2 border-t border-slate-100 gap-3 items-center">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">System Assignment</span>
                  <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">
                    👤 {selectedTicket.currentAssignedTo?.name || 'Unassigned Node'}
                  </span>
                  {selectedTicket.currentAssignedTo?.role && (
                    <span className="text-[9px] text-slate-400 italic block">({selectedTicket.currentAssignedTo.role})</span>
                  )}
                </div>
                
                <div className="text-right">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Processing Phase</span>
                  <span className={`inline-block mt-0.5 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                    selectedTicket.status === 'CLOSED' ? 'bg-rose-600 border-rose-700 text-white font-black' : 'bg-slate-900 border-slate-900 text-white'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-start">
                {selectedTicket.status === 'RESOLVED' ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={triggerCloseConfirm}
                      disabled={closingTicket}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm shrink-0"
                    >
                      {closingTicket ? 'Closing...' : '🔒 Close Ticket'}
                    </button>
                    <button
                      onClick={triggerReopenConfirm}
                      disabled={reopeningTicket}
                      className="flex-1 md:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm shrink-0"
                    >
                      {reopeningTicket ? 'Reopening...' : '🔄 Reopen Ticket'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={triggerCloseConfirm}
                    disabled={closingTicket || selectedTicket.status === 'IN_PROGRESS' || selectedTicket.status === 'CLOSED'}
                    className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-sm shrink-0"
                  >
                    {selectedTicket.status === 'CLOSED' ? '🔒 Closed' : closingTicket ? 'Closing...' : 'Close Ticket'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex justify-between items-center shrink-0 text-left">
              <div className="text-[9px] sm:text-[10px] text-slate-500 flex items-center gap-1">
                <span>Due Date Target:</span>
                <b className="text-slate-700 font-bold">
                  {new Date(selectedTicket.deadlineAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </b>
              </div>
              {selectedTicket.status !== 'CLOSED' && <ActionDeadlineCounter targetDate={selectedTicket.deadlineAt} />}
            </div>

            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50 text-left base-page-scroller">
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Communication Audit Trail</span>
              {comments.length === 0 ? (
                <div className="text-center py-10 text-[10px] font-medium text-slate-400">No log interactions registered on this node.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm space-y-1 max-w-[92%] md:max-w-[85%]">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-[9px] font-bold text-slate-900">{comment.author?.name}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">{comment.author?.role}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{comment.body}</p>
                    <span className="text-[8px] text-slate-400 block text-right">
                      {new Date(comment.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handlePostComment} className="p-2.5 bg-white border-t border-slate-200 flex gap-2 shrink-0">
              <input 
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={selectedTicket.status === 'CLOSED'} 
                placeholder={selectedTicket.status === 'CLOSED' ? "This ticket has been permanently closed." : "Type your message or inquiry here..."}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-green-600 transition-colors bg-slate-50 disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim() || selectedTicket.status === 'CLOSED'} 
                className="px-4 py-1.5 bg-slate-900 hover:bg-green-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                {submittingComment ? '...' : 'Send'}
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-slate-400">
            <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Select a ticket from the queue view parameters</span>
          </div>
        )}
      </div>

      {/* 🔮 CONFIRMATION DIALOG */}
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

    </div>
  );
}