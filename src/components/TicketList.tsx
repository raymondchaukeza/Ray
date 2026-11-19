import React, { useState } from 'react';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  Phone,
  Hash,
  Shield,
  User,
  PlusCircle,
  ExternalLink,
  ArrowRight,
  Activity,
  Check,
  ChevronRight,
} from 'lucide-react';
import { FaultTicket, TicketStatus, UserSession } from '../types/index.ts';
import {
  formatZARPhone,
  maskPublicPhone,
  maskPublicId,
  TICKET_TRANSITION_STEPS,
  getTicketProgressPercentage,
  getNextTicketStatus,
} from '../utils/ticketRules.ts';

interface TicketListProps {
  tickets: FaultTicket[];
  currentUser: UserSession | null;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus, noteText?: string) => void;
  onAddNote: (ticketId: string, noteText: string, isStaff: boolean) => void;
  onOpenNewTicket: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  currentUser,
  onUpdateTicketStatus,
  onAddNote,
  onOpenNewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.faultDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phoneNumbers.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    const isStaff = currentUser?.role === 'technician' || currentUser?.role === 'admin';
    onAddNote(selectedTicket.id, replyText.trim(), isStaff);
    setReplyText('');
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Investigating':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Technician Dispatched':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Closed':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-400 bg-red-950/60 border-red-800';
      case 'High':
        return 'text-orange-400 bg-orange-950/60 border-orange-800';
      case 'Medium':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      default:
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-2xl p-6 shadow-xl"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <span>NOC Fault Tickets & Support Desk</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status tracking for reported line faults, voucher errors, and technician dispatches.
          </p>
        </div>

        <button
          onClick={onOpenNewTicket}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Ticket</span>
        </button>
      </div>

      {/* Main Grid: List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Bar */}
          <div
            className="border rounded-xl p-3 space-y-2"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticket, account, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ backgroundColor: '#060606' }}
                className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {['All', 'Open', 'Investigating', 'Technician Dispatched', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div
                className="p-8 text-center border rounded-xl text-slate-400 text-xs"
                style={{ backgroundColor: '#000000', borderColor: '#232323' }}
              >
                No tickets found matching your filter criteria.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    style={{
                      backgroundColor: isSelected ? '#0a0a0a' : '#000000',
                      borderColor: isSelected ? '#06b6d4' : '#232323',
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'shadow-md ring-1 ring-cyan-500/30'
                        : 'hover:bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {t.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-2">
                      {t.faultDetails}
                    </p>

                    {/* Mini Progress Track */}
                    <div className="my-2 space-y-1">
                      <div className="flex items-center gap-1">
                        {['Open', 'Investigating', 'Technician Dispatched', 'Resolved'].map((st, i) => {
                          const order = ['Open', 'Investigating', 'Technician Dispatched', 'Resolved'];
                          const currentIdx = order.indexOf(t.status);
                          const isDone = currentIdx >= i || t.status === 'Resolved' || t.status === 'Closed';
                          return (
                            <div
                              key={st}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                isDone
                                  ? i === 3
                                    ? 'bg-emerald-400'
                                    : 'bg-cyan-400'
                                  : 'bg-slate-800'
                              }`}
                              title={st}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{t.accountNumber}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.2 rounded border text-[10px] ${getPriorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-cyan-400 font-mono font-semibold">
                        {getTicketProgressPercentage(t.status)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Detail & NOC Discussion */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div
              className="border rounded-2xl p-6 shadow-xl space-y-6"
              style={{ backgroundColor: '#000000', borderColor: '#232323' }}
            >
              {/* Ticket Top bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-cyan-300">
                      {selectedTicket.id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${getPriorityColor(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Logged on {selectedTicket.createdAt} SAST • SLA Target:{' '}
                    <span className="text-slate-200">{selectedTicket.estimatedResolution || 'Active'}</span>
                  </p>
                </div>

                {/* Technician quick status update controls */}
                {currentUser?.role === 'technician' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Change Status:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        onUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)
                      }
                      className="px-2.5 py-1 bg-slate-800 border border-cyan-700 rounded-lg text-xs text-cyan-200 focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Technician Dispatched">Technician Dispatched</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Visual Progress Timeline for Ticket Status Transitions */}
              <div
                className="border rounded-2xl p-5 shadow-inner space-y-4"
                style={{ backgroundColor: '#070707', borderColor: '#232323' }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase">
                        Ticket Resolution Timeline & Status Transitions
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                        {getTicketProgressPercentage(selectedTicket.status)}% Completed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Visual progression tracking how this ticket moves from initial submission to verified resolution.
                    </p>
                  </div>

                  {/* Transition action button */}
                  {getNextTicketStatus(selectedTicket.status) && (
                    <button
                      onClick={() => {
                        const target = getNextTicketStatus(selectedTicket.status);
                        if (target) {
                          onUpdateTicketStatus(
                            selectedTicket.id,
                            target,
                            `Advanced ticket status from [${selectedTicket.status}] to [${target}] via resolution workflow.`
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition transform active:scale-95"
                    >
                      <span>Advance to: {getNextTicketStatus(selectedTicket.status)}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Overall Animated Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/80 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${getTicketProgressPercentage(selectedTicket.status)}%` }}
                    />
                  </div>
                </div>

                {/* 4-Step Interactive Horizontal Track */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                  {TICKET_TRANSITION_STEPS.map((step, idx) => {
                    const stepNumber = idx + 1;
                    const order = ['Open', 'Investigating', 'Technician Dispatched', 'Resolved'];
                    const currentIdx = order.indexOf(selectedTicket.status);
                    const stepIdx = order.indexOf(step.status);

                    const isCompleted = currentIdx > stepIdx || selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed';
                    const isCurrent = selectedTicket.status === step.status;
                    const isPending = !isCompleted && !isCurrent;

                    return (
                      <button
                        key={step.status}
                        onClick={() => {
                          onUpdateTicketStatus(
                            selectedTicket.id,
                            step.status,
                            `Status transitioned to [${step.status}] via resolution timeline.`
                          );
                        }}
                        className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between group ${
                          isCurrent
                            ? 'bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
                            : isCompleted
                            ? 'bg-emerald-950/25 border-emerald-600/50 hover:bg-emerald-950/40'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        {/* Step Header Badge */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-slate-950'
                                : isCurrent
                                ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : stepNumber}
                          </div>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              isCurrent
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isCurrent ? 'Active' : isCompleted ? 'Completed' : 'Queued'}
                          </span>
                        </div>

                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-cyan-300'
                                : isCompleted
                                ? 'text-emerald-300'
                                : 'text-slate-300'
                            }`}
                          >
                            {step.displayName}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 group-hover:text-cyan-400 transition">
                            {isCurrent ? 'Current Phase' : 'Click to select'}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account and Subscriber Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Account Number</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {selectedTicket.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Phone (SMS)</span>
                  <span className="font-semibold text-white">
                    {currentUser
                      ? formatZARPhone(selectedTicket.phoneNumbers)
                      : maskPublicPhone(selectedTicket.phoneNumbers)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">ID / Passport</span>
                  <span className="font-mono text-slate-300">
                    {currentUser ? selectedTicket.idNumber : maskPublicId(selectedTicket.idNumber)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Package Speed</span>
                  <span className="font-semibold text-cyan-300 truncate block">
                    {selectedTicket.lineSpeed}
                  </span>
                </div>
              </div>

              {/* Primary Fault Description */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Reported Issue Description:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.faultDetails}
                </p>

                {selectedTicket.voucherError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Associated Voucher / PIN Code: <strong>{selectedTicket.voucherError}</strong></span>
                  </div>
                )}

                {selectedTicket.imageFileName && (
                  <div className="mt-3">
                    <span className="text-xs text-slate-400 block mb-1">Attached Picture:</span>
                    <div className="inline-flex items-center gap-2 p-2 bg-slate-800 rounded-lg border border-slate-700 text-xs">
                      {selectedTicket.imageDataUrl && (
                        <img
                          src={selectedTicket.imageDataUrl}
                          alt="Fault preview"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-mono text-slate-200">{selectedTicket.imageFileName}</div>
                        <div className="text-[10px] text-emerald-400">Verified by Gateway</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline & Notes Discussion */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Support Updates & NOC History ({selectedTicket.notes.length})</span>
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
                  {selectedTicket.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border text-xs ${
                        note.isStaff
                          ? 'bg-blue-950/40 border-blue-800/60 text-blue-200 ml-4'
                          : 'bg-slate-800/60 border-slate-700/70 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          {note.isStaff ? (
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{note.author}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {note.timestamp}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add reply form */}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      currentUser?.role === 'technician'
                        ? 'Add technician inspection note or dispatch update...'
                        : 'Reply with additional info or update...'
                    }
                    className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm">
              Select a ticket on the left to view full technical history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
