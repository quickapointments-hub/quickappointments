import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const ProviderDashboardScreen: React.FC<{
  onNavigateToSchedule: () => void;
  onNavigateToEarnings: () => void;
}> = ({ onNavigateToSchedule, onNavigateToEarnings }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({ totalNet: 0, totalGross: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderData();
  }, []);

  const loadProviderData = async () => {
    try {
      setLoading(true);
      const [bRes, eRes] = await Promise.all([
        mobileApi.getProviderBookings().catch(() => ({ data: [] })),
        mobileApi.getProviderEarnings().catch(() => ({ data: { totalNet: 0, totalGross: 0 } })),
      ]);
      setBookings(bRes.data || []);
      setEarnings(eRes.data || { totalNet: 0, totalGross: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await mobileApi.updateBookingStatus(bookingId, status);
      await loadProviderData();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const pendingBookings = bookings.filter((b) => ['CONFIRMED', 'PENDING'].includes(b.status));

  return (
    <div className="pb-24 px-5 pt-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            Provider Cockpit
          </span>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight mt-1">
            {user?.providerProfile?.businessName || user?.fullName}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Active & Live</span>
        </div>
      </div>

      {/* Earnings Quick Card */}
      <div
        onClick={onNavigateToEarnings}
        className="p-5 rounded-3xl bg-charcoal-900 text-white shadow-xl border border-charcoal-800 cursor-pointer hover:border-brand-500/50 transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Total Net Earnings</span>
          <span className="text-[11px] text-brand-400 font-semibold flex items-center gap-1">
            <span>Ledger Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-3xl font-bold font-display text-white">
          ₹{(earnings.totalNet || 0).toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Gross: ₹{(earnings.totalGross || 0).toLocaleString()} (Fee split automated)
        </p>
      </div>

      {/* Working Hours Shortcut */}
      <div
        onClick={onNavigateToSchedule}
        className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-400 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Working Hours & Lunch Breaks</h4>
            <p className="text-[10px] text-slate-400">Mon-Sat 09:00 - 19:00 (Lunch 13:00 - 14:00)</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>

      {/* Appointment Requests & Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Active Appointment Queue</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {pendingBookings.length} Active
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            No pending appointment requests right now. Your open slots are live on the customer app.
          </div>
        ) : (
          pendingBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                    {b.bookingRef}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-0.5">{b.service?.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    Client: {b.customer?.user?.fullName} ({b.customer?.user?.phone})
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-700 font-display">
                  ₹{b.totalAmount}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>{b.date}</span>
                </span>
                <span className="font-mono text-[11px]">
                  {b.startTime} - {b.endTime}
                </span>
              </div>

              {b.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl italic">
                  Note: "{b.notes}"
                </p>
              )}

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                  className="flex-1 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all"
                >
                  Mark Completed
                </button>
                <button
                  onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

