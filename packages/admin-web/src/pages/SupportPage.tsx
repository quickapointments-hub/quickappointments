import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { HelpCircle, MessageSquare, CheckCircle2, AlertCircle, Send, ArrowRight } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTickets();
      setTickets(res.data || []);
      if (res.data?.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket || !resolutionText.trim()) {
      alert('Please enter a resolution summary');
      return;
    }
    try {
      setResolving(true);
      await api.resolveSupportTicket(selectedTicket.id, resolutionText);
      setSuccessMsg(`Ticket ${selectedTicket.ticketRef} marked as RESOLVED! Notification sent to user.`);
      setResolutionText('');
      await loadTickets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-600" />
          <span>Support Desk & Dispute Resolution Console</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review customer inquiries, disputed appointments, payment issues, and manage resolution communication.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex items-center justify-between">
            <span>Ticket Queue</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-normal">
              {tickets.length} Total
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active dispute or support tickets.
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTicket?.id === t.id ? 'bg-brand-50/60 border-l-4 border-brand-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono font-bold text-slate-600">{t.ticketRef}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.subject}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.user?.fullName} ({t.category})</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Ticket Thread & Resolution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between min-h-[500px]">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {selectedTicket.ticketRef} • {selectedTicket.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-slate-500">
                    User: {selectedTicket.user?.fullName} ({selectedTicket.user?.phone} • {selectedTicket.user?.email || 'No email'})
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedTicket.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedTicket.status}
                </span>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 py-2 max-h-72 overflow-y-auto">
                {(selectedTicket.messages || []).map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl text-xs max-w-lg ${
                      m.senderRole === 'ADMIN'
                        ? 'ml-auto bg-charcoal-900 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 font-semibold">
                      <span>{m.senderRole}</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-relaxed">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Resolution Box */}
              {selectedTicket.status !== 'RESOLVED' ? (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Post Admin Resolution
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Enter formal resolution details or actions taken..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                  <button
                    onClick={handleResolve}
                    disabled={resolving}
                    className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ml-auto disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{resolving ? 'Submitting...' : 'Resolve Ticket'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <span className="font-bold">Resolved:</span> {selectedTicket.resolution}
                </div>
              )}
            </div>
          ) : (
            <div className="m-auto text-center text-xs text-slate-400 py-20">
              Select a ticket from the queue to review context and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

