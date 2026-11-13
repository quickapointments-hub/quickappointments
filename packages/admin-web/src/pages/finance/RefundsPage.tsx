import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { RotateCcw, AlertTriangle, Clock, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';

export const RefundsPage: React.FC = () => {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const res = await api.getRefunds();
      setRefunds(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await api.processRefund(bookingId, 'Admin authorized 100% customer refund within 48-hour SLA');
      setSuccessMsg('100% refund successfully processed through payment gateway! Customer notified.');
      await loadRefunds();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-brand-600" />
          <span>48-Hour 100% Customer Refund Queue</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Guaranteed 100% refund compliance desk. Cancelled appointments require gateway processing within 48 hours. Items older than 36 hours highlight red.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Booking Ref</th>
              <th className="px-6 py-3.5">Client</th>
              <th className="px-6 py-3.5">Service & Provider</th>
              <th className="px-6 py-3.5">Refund Amount</th>
              <th className="px-6 py-3.5">SLA Countdown</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  Loading refund queue...
                </td>
              </tr>
            ) : refunds.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No pending refund requests. All customer cancellations are settled.
                </td>
              </tr>
            ) : (
              refunds.map((r) => {
                const hoursOld = (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
                const isUrgent = hoursOld >= 36 && r.status !== 'REFUNDED';
                const hoursRemaining = Math.max(0, Math.round(48 - hoursOld));

                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${
                      isUrgent ? 'bg-rose-50/70 hover:bg-rose-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {r.booking?.bookingRef || r.bookingId.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div>{r.booking?.customer?.user?.fullName || 'Client'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.booking?.customer?.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-semibold text-slate-900">{r.booking?.service?.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.booking?.provider?.businessName || r.booking?.provider?.user?.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold font-display text-slate-900">₹{r.amount}</td>
                    <td className="px-6 py-4 font-medium">
                      {r.status === 'REFUNDED' ? (
                        <span className="text-emerald-700 font-semibold">Settled</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${
                            isUrgent ? 'text-rose-700 animate-pulse' : 'text-slate-600'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{hoursRemaining}h remaining</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'REFUNDED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isUrgent
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 font-extrabold'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status !== 'REFUNDED' && (
                        <button
                          onClick={() => handleProcessRefund(r.bookingId)}
                          disabled={processingId === r.bookingId}
                          className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                        >
                          {processingId === r.bookingId ? 'Processing...' : 'Process 100% Refund'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

