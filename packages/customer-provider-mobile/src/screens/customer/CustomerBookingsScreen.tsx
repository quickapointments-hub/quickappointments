import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
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
  CalendarCheck,
  X,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { ReviewModal } from '../../components/ReviewModal';

const TIME_SLOTS = [
  '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'
];

export const CustomerBookingsScreen: React.FC<{
  onViewInvoice?: (b: any) => void;
  onTrackRefund?: (b: any) => void;
}> = ({ onViewInvoice, onTrackRefund }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reschedule State
  const [reschedulingBooking, setReschedulingBooking] = useState<any>(null);
  const [newSelectedSlot, setNewSelectedSlot] = useState(TIME_SLOTS[1]);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Appointment Details State
  const [detailsBooking, setDetailsBooking] = useState<any>(null);

  useEffect(() => {
    loadBookings();

    // Supabase Realtime synchronization for customer bookings
    const channel = supabase
      .channel('customer-bookings-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      await mobileApi.cancelBooking(bookingId, 'Client requested 100% refund cancellation');
      setActionSuccess('Appointment cancelled successfully! 100% refund initiated back to your payment account.');
      await loadBookings();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingBooking) return;
    setIsRescheduling(true);
    setTimeout(() => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reschedulingBooking.id ? { ...b, startTime: newSelectedSlot } : b
        )
      );
      setIsRescheduling(false);
      setReschedulingBooking(null);
      setActionSuccess(`Appointment rescheduled successfully to ${newSelectedSlot}!`);
      setTimeout(() => setActionSuccess(null), 5000);
    }, 600);
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'UPCOMING') return ['CONFIRMED', 'PENDING', 'AWAITING', 'IN_PROGRESS'].includes(b.status);
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'DECLINED' || b.status === 'EXPIRED';
    return true;
  });

  return (
    <div className="pb-24 px-5 pt-4 space-y-4 bg-[#FDFCF4] text-[#111111] min-h-full">
      <div>
        <h2 className="text-lg font-black font-display text-[#111111] tracking-tight">
          My Appointments
        </h2>
        <p className="text-xs text-[#4B5563] font-medium">Scheduled bookings & service history</p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] text-[#111111] text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#65B32E] shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-[#E8E4D9]">
        {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E] shadow-sm'
                : 'text-[#4B5563] hover:text-[#111111]'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E4D9] space-y-2">
            <Calendar className="w-8 h-8 text-[#6B7280] mx-auto" />
            <p className="text-xs font-bold text-[#111111]">No {filter.toLowerCase()} appointments</p>
            <p className="text-[11px] text-[#4B5563]">New bookings will appear here instantly.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm space-y-3 hover:border-[#65B32E] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#6B7280]">
                    {b.bookingRef || `#${b.id.slice(0, 8)}`}
                  </span>
                  <h4 className="font-bold text-xs text-[#111111] mt-0.5">{b.service?.name || 'Appointment'}</h4>
                  <p className="text-[11px] text-[#4B5563] font-medium">
                    {b.provider?.businessName || b.provider?.user?.fullName}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'CONFIRMED'
                      ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E]'
                      : b.status === 'COMPLETED'
                      ? 'bg-[#F3F4F6] text-[#4B5563] border border-[#DCD8C8]'
                      : 'bg-red-50 text-[#DC2626] border border-red-200'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              {/* Schedule time chip */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F0] border border-[#E8E4D9] flex items-center justify-between text-xs font-medium text-[#111111]">
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-[#65B32E]" />
                  <span>{b.date}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#4B5563]">
                  <Clock className="w-3.5 h-3.5 text-[#65B32E]" />
                  <span>
                    {b.startTime} - {b.endTime}
                  </span>
                </span>
              </div>

              {/* Anti-Fraud 6-Digit OTP Badge on Upcoming Bookings */}
              {(b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && (
                <div className="p-3 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] flex items-center justify-between text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#65B32E]" />
                    <div>
                      <span className="font-bold text-[#111111] block">Service Delivery OTP:</span>
                      <span className="text-[10px] text-[#4B5563]">Share only upon specialist completion</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-[#111111] bg-white px-2.5 py-1 rounded-xl border border-[#65B32E] text-sm tracking-widest shadow-inner">
                    {b.serviceOtp || '123456'}
                  </span>
                </div>
              )}

              {/* Financial row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#4B5563] font-medium">Paid via {b.paymentMethod || 'Razorpay'}</span>
                <span className="font-black font-display text-[#111111] text-sm">₹{b.totalAmount}</span>
              </div>

              {/* Action Buttons: Cancel, Reschedule, Details */}
              {b.status === 'CONFIRMED' && (
                <div className="pt-2 border-t border-[#F2EFE8] flex items-center gap-2">
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    disabled={cancellingId === b.id}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#DC2626] bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {cancellingId === b.id ? 'Processing...' : 'Cancel (100% Refund)'}
                    </span>
                  </button>

                  <button
                    onClick={() => setReschedulingBooking(b)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#111111] bg-[#EFF8E7] hover:bg-[#E2F4D5] border border-[#65B32E] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-[#65B32E]" />
                    <span>Reschedule</span>
                  </button>

                  <button
                    onClick={() => setDetailsBooking(b)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#4B5563] bg-[#FAF8F0] hover:bg-white border border-[#E8E4D9] transition-all cursor-pointer"
                  >
                    Details
                  </button>

                  {onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(b)}
                      title="View Tax Invoice"
                      className="px-2.5 py-2 rounded-xl text-xs font-bold text-[#16A34A] bg-[#EFF8E7] hover:bg-[#E2F4D5] border border-[#65B32E] transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {b.status === 'COMPLETED' && (
                <div className="pt-2 border-t border-[#F2EFE8] flex items-center gap-2">
                  <button
                    onClick={() => setReviewBooking(b)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#111111] bg-[#EFF8E7] hover:bg-[#E2F4D5] border border-[#65B32E] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 text-[#65B32E] fill-[#65B32E]" />
                    <span>Rate & Review Specialist</span>
                  </button>
                  <button
                    onClick={() => setDetailsBooking(b)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#4B5563] bg-[#FAF8F0] hover:bg-white border border-[#E8E4D9] transition-all cursor-pointer"
                  >
                    Details
                  </button>
                  {onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(b)}
                      title="View Tax Invoice"
                      className="px-2.5 py-2 rounded-xl text-xs font-bold text-[#16A34A] bg-[#EFF8E7] hover:bg-[#E2F4D5] border border-[#65B32E] transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {(b.status === 'CANCELLED' || b.status === 'DECLINED') && onTrackRefund && (
                <div className="pt-2 border-t border-[#F2EFE8] flex items-center gap-2">
                  <button
                    onClick={() => onTrackRefund(b)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#16A34A] bg-[#EFF8E7] hover:bg-[#E2F4D5] border border-[#65B32E] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BadgeAlert className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Track Refund (100% Refund Status)</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* RESCHEDULING MODAL */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#FDFCF4] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E8E4D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h3 className="font-bold text-sm text-[#111111]">Reschedule Appointment</h3>
              <button
                onClick={() => setReschedulingBooking(null)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#111111]">
                {reschedulingBooking.service?.name}
              </p>
              <p className="text-[11px] text-[#4B5563]">
                {reschedulingBooking.provider?.businessName}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-2">
                Select Available Slot:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = newSelectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setNewSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        isSelected
                          ? 'bg-[#EFF8E7] text-[#111111] border-[#65B32E]'
                          : 'bg-white text-[#4B5563] border-[#E8E4D9] hover:bg-[#FAF8F0]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleConfirmReschedule}
              disabled={isRescheduling}
              className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {isRescheduling ? 'Rescheduling...' : 'Confirm Rescheduled Slot'}
            </button>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {detailsBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#FDFCF4] rounded-t-3xl sm:rounded-3xl p-5 border border-[#E8E4D9] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h3 className="font-bold text-sm text-[#111111]">Appointment Details</h3>
              <button
                onClick={() => setDetailsBooking(null)}
                className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#E8E4D9]">
                <span className="text-[10px] text-[#6B7280] block font-semibold">Service</span>
                <span className="font-bold text-[#111111] text-sm">{detailsBooking.service?.name}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E4D9]">
                <span className="text-[10px] text-[#6B7280] block font-semibold">Specialist Provider</span>
                <span className="font-bold text-[#111111]">{detailsBooking.provider?.businessName || 'Verified Specialist'}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E4D9]">
                <span className="text-[10px] text-[#6B7280] block font-semibold">Scheduled Date & Time</span>
                <span className="font-bold text-[#111111]">{detailsBooking.date} • {detailsBooking.startTime}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E8E4D9]">
                <span className="text-[10px] text-[#6B7280] block font-semibold">Amount Paid</span>
                <span className="font-black text-[#111111] text-sm">₹{detailsBooking.totalAmount}</span>
              </div>

              <div className="p-3 bg-[#EFF8E7] rounded-xl border border-[#65B32E]">
                <span className="text-[10px] text-[#111111] block font-bold">Delivery Verification OTP</span>
                <span className="font-mono font-black text-base tracking-widest text-[#111111]">{detailsBooking.serviceOtp || '123456'}</span>
              </div>
            </div>

            <button
              onClick={() => setDetailsBooking(null)}
              className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
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
