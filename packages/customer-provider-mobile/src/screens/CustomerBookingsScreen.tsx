import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Star,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { ReviewModal } from '../components/ReviewModal';

export const CustomerBookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getCustomerBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this appointment? 100% of your paid amount will be refunded to your original payment method within 48 hours.')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const res = await mobileApi.cancelBooking(bookingId, 'Client requested 100% refund cancellation');
      setActionSuccess('Appointment cancelled successfully! 100% refund initiated back to your payment account.');
      await loadBookings();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'UPCOMING') return ['CONFIRMED', 'PENDING', 'AWAITING', 'IN_PROGRESS'].includes(b.status);
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'DECLINED' || b.status === 'EXPIRED';
    return true;
  });

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          My Appointments
        </h2>
        <p className="text-xs text-slate-500">Scheduled bookings & service history</p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200">
        {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No {filter.toLowerCase()} appointments</p>
            <p className="text-[11px] text-slate-400">New bookings will appear here instantly.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {b.bookingRef}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-0.5">{b.service?.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {b.provider?.businessName || b.provider?.user?.fullName}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : b.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              {/* Schedule time chip */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>{b.date}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {b.startTime} - {b.endTime}
                  </span>
                </span>
              </div>

              {/* Anti-Fraud 6-Digit OTP Badge on Upcoming Bookings (C-08) */}
              {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-semibold text-amber-950 block">Service Delivery OTP:</span>
                      <span className="text-[10px] text-amber-700">Share only upon provider arrival</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-950 bg-white px-2.5 py-1 rounded-xl border border-amber-200 text-sm tracking-widest shadow-inner">
                    {b.serviceOtp || '123456'}
                  </span>
                </div>
              )}

              {/* Financial row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Paid via {b.paymentMethod}</span>
                <span className="font-bold font-display text-slate-900 text-sm">₹{b.totalAmount}</span>
              </div>

              {/* Action Buttons: 1-click 100% Refund Cancel (C-10) or Rate & Review (C-12) */}
              {b.status === 'CONFIRMED' && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {cancellingId === b.id ? 'Processing...' : 'Cancel Appointment (100% Refund)'}
                    </span>
                  </button>
                </div>
              )}

              {b.status === 'COMPLETED' && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setReviewBooking(b)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-slate-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Rate & Review Provider</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal (C-12) */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onSuccess={() => {
            setReviewBooking(null);
            loadBookings();
            setActionSuccess('Thank you! Your verified review has been published.');
            setTimeout(() => setActionSuccess(null), 4000);
          }}
          onClose={() => setReviewBooking(null)}
        />
      )}
    </div>
  );
};

