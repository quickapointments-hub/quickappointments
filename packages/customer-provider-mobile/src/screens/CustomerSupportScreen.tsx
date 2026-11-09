import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface CustomerSupportScreenProps {
  onBack?: () => void;
}

export const CustomerSupportScreen: React.FC<CustomerSupportScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // New Ticket Form State
  const [formData, setFormData] = useState({
    category: 'CANCELLATION',
    subject: '',
    description: '',
    priority: 'NORMAL',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getMyTickets();
      setTickets(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Please fill out all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await mobileApi.createSupportTicket(formData);
      setShowNewModal(false);
      setFormData({ category: 'CANCELLATION', subject: '', description: '', priority: 'NORMAL' });
      await loadTickets();
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;

    try {
      setSubmittingReply(true);
      const res = await mobileApi.addTicketReply(activeTicket.id, replyText);
      const newMsg = res.data;
      setActiveTicket({
        ...activeTicket,
        messages: [...(activeTicket.messages || []), newMsg],
      });
      setReplyText('');
      loadTickets();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Open</span>;
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">In Review</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
              Support & Help Desk
            </h2>
            <p className="text-[11px] text-slate-500">24/7 Dispute resolution & support assistance</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-brand-400" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Assurance Card */}
      <div className="p-3.5 rounded-2xl bg-brand-50/60 border border-brand-200/50 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="text-xs text-brand-900">
          <p className="font-bold">100% Refund & Concurrency Protection</p>
          <p className="text-[11px] text-brand-800/80 mt-0.5">
            Bookings cancelled up to 48 hours prior to appointment receive instant 100% refunds without penalty fees.
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No support tickets found</h4>
            <p className="text-[11px] text-slate-500">
              Need help with a booking, payment, or provider? Raise a ticket and our team will resolve it within 2 hours.
            </p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setActiveTicket(t)}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-sm cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {t.ticketRef}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-0.5">{t.subject}</h4>
                </div>
                {getStatusBadge(t.status)}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[10px] text-slate-700">
                  {t.category}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Raise Support Ticket</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-brand-500"
                >
                  <option value="CANCELLATION">Cancellation & Refund</option>
                  <option value="PAYMENT">Payment / Billing Issue</option>
                  <option value="FRAUD_OTP">OTP / Security Verification</option>
                  <option value="SERVICE_QUALITY">Service Quality & Dispute</option>
                  <option value="GENERAL">General Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. 100% Refund for Cancelled Appointment"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-charcoal-900 text-white text-xs font-bold shadow-sm hover:bg-black disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Chat Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl h-[520px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400">
                  {activeTicket.ticketRef}
                </span>
                <h4 className="font-bold text-xs text-slate-900 truncate max-w-[200px]">
                  {activeTicket.subject}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activeTicket.status)}
                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {activeTicket.resolution && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px] text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Official Resolution
                  </span>
                  <p className="text-[11px] leading-relaxed">{activeTicket.resolution}</p>
                </div>
              )}

              {activeTicket.messages?.map((msg: any) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      {isMine ? 'You' : msg.senderRole || 'Support Desk'}
                    </span>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? 'bg-charcoal-900 text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type reply to support desk..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                className="flex-1 bg-slate-100 px-3.5 py-2 rounded-xl text-xs outline-none focus:bg-white focus:ring-1 focus:ring-brand-500"
              />
              <button
                onClick={handleSendReply}
                disabled={submittingReply || !replyText.trim()}
                className="p-2 rounded-xl bg-charcoal-900 hover:bg-black text-brand-400 disabled:opacity-40 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

