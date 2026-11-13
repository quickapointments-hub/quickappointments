import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
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
  KeyRound,
} from 'lucide-react';
import { IncomingRequestModal } from '../../components/IncomingRequestModal';
import { BookingOtpModal } from '../../components/BookingOtpModal';

export const ProviderDashboardScreen: React.FC<{
  onNavigateToSchedule: () => void;
  onNavigateToEarnings: () => void;
}> = ({ onNavigateToSchedule, onNavigateToEarnings }) => {
  const { user, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({ totalNet: 0, totalGross: 0 });
  const [loading, setLoading] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [otpBooking, setOtpBooking] = useState<any>(null);

  useEffect(() => {
    loadProviderData();

    const unsubscribeSync = mobileApi.subscribeToSync(() => {
      loadProviderData();
      refreshProfile();
    });

    const channel = supabase
      .channel('provider-dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadProviderData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        loadProviderData();
        refreshProfile();
      })
      .subscribe();

    return () => {
      unsubscribeSync();
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProviderData = async () => {
    try {
      setLoading(true);
      const dashRes = await mobileApi.getProviderDashboard().catch(() => null);
      if (dashRes?.data) {
        const list = dashRes.data.bookings || [];
        setBookings(list);
        setEarnings(dashRes.data.earnings || { totalNet: 0, totalGross: 0 });
        const awaiting = list.find((b: any) => b.status === 'AWAITING' || b.status === 'PENDING');
        if (awaiting && !activeRequest) {
          setActiveRequest(awaiting);
        }
        return;
      }

      const [bRes, eRes] = await Promise.all([
        mobileApi.getProviderBookings().catch(() => ({ data: [] })),
        mobileApi.getProviderEarnings().catch(() => ({ data: { totalNet: 0, totalGross: 0 } })),
      ]);
      const list = bRes.data || [];
      setBookings(list);
      setEarnings(eRes.data || { totalNet: 0, totalGross: 0 });

      const awaiting = list.find((b: any) => b.status === 'AWAITING' || b.status === 'PENDING');
      if (awaiting && !activeRequest) {
        setActiveRequest(awaiting);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccepting = async () => {
    const currentlyAccepting = Boolean(user?.providerProfile?.isAcceptingBookings);
    try {
      setTogglingOnline(true);
      await mobileApi.toggleProviderAcceptingBookings(!currentlyAccepting);
      await refreshProfile();
    } catch (err: any) {
      alert(err.message || 'Unable to update booking status');
    } finally {
      setTogglingOnline(false);
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

  const pendingBookings = bookings.filter((b) =>
    ['CONFIRMED', 'PENDING', 'AWAITING', 'IN_PROGRESS'].includes(b.status)
  );
  const verificationStatus =
    user?.providerProfile?.verificationStatus || user?.providerProfile?.verification_status || 'PENDING';
  const isApproved = verificationStatus === 'APPROVED';

  return (
    <div className="pb-24 px-5 pt-4 space-y-5 bg-[#FDFCF4] text-[#111111] min-h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] bg-[#EFF8E7] border border-[#65B32E] px-2 py-0.5 rounded-full">
            Provider Cockpit
          </span>
          <h2 className="text-lg font-black font-display text-[#111111] tracking-tight mt-1">
            {user?.providerProfile?.businessName || user?.fullName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && (
            <button
              onClick={handleToggleAccepting}
              disabled={togglingOnline}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                user?.providerProfile?.isAcceptingBookings
                  ? 'bg-[#65B32E] text-white border-[#65B32E]'
                  : 'bg-white text-[#4B5563] border-[#DCD8C8]'
              }`}
            >
              {togglingOnline
                ? '...'
                : user?.providerProfile?.isAcceptingBookings
                ? 'Online'
                : 'Offline'}
            </button>
          )}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isApproved
                ? 'bg-[#EFF8E7] text-[#111111] border-[#65B32E]'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isApproved ? 'text-[#65B32E]' : 'text-amber-600'}`} />
            <span>{isApproved ? 'Active & Live' : verificationStatus}</span>
          </div>
        </div>
      </div>

      {/* Earnings Quick Card (Official Brand Clean White with Green Accent) */}
      <div
        onClick={onNavigateToEarnings}
        className="p-5 rounded-3xl bg-white text-[#111111] shadow-sm border border-[#E8E4D9] cursor-pointer hover:border-[#65B32E] transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#4B5563]">Total Net Earnings</span>
          <span className="text-[11px] text-[#65B32E] font-bold flex items-center gap-1">
            <span>Ledger Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-3xl font-black font-display text-[#111111]">
          ₹{(earnings.totalNet || 0).toLocaleString()}
        </div>
        <p className="text-[11px] text-[#4B5563] mt-1 font-medium">
          Gross: ₹{(earnings.totalGross || 0).toLocaleString()} (Automated direct bank settlements)
        </p>
      </div>

      {/* Working Hours Shortcut */}
      <div
        onClick={onNavigateToSchedule}
        className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#65B32E] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFF8E7] text-[#111111] border border-[#65B32E]/30">
            <Clock className="w-4 h-4 text-[#65B32E]" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#111111]">Working Hours & Slot Availability</h4>
            <p className="text-[10px] text-[#4B5563]">Mon-Sat 09:00 - 19:00 (Lunch 13:00 - 14:00)</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#6B7280]" />
      </div>

      {/* Appointment Requests & Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111111]">Active Appointment Queue</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E]">
            {pendingBookings.length} Active
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#6B7280]">Loading appointments...</div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-[#E8E4D9] text-xs text-[#4B5563] font-medium">
            No pending appointment requests right now. Your open slots are live on the customer app.
          </div>
        ) : (
          pendingBookings.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm space-y-3 hover:border-[#65B32E] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-[#6B7280] font-bold">
                    {b.bookingRef || `#${b.id.slice(0, 8)}`}
                  </span>
                  <h4 className="font-bold text-xs text-[#111111] mt-0.5">{b.service?.name}</h4>
                  <p className="text-[11px] text-[#4B5563] font-medium">
                    Client: {b.customer?.user?.fullName} ({b.customer?.user?.phone})
                  </p>
                </div>
                <span className="text-sm font-black text-[#111111] font-display">
                  ₹{b.totalAmount}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-[#FAF8F0] border border-[#E8E4D9] flex items-center justify-between text-xs font-semibold text-[#111111]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#65B32E]" />
                  <span>{b.date}</span>
                </span>
                <span className="font-mono text-[11px]">
                  {b.startTime} - {b.endTime}
                </span>
              </div>

              {b.notes && (
                <p className="text-[11px] text-[#4B5563] bg-[#FAF8F0] p-2 rounded-xl italic border border-[#E8E4D9]">
                  Note: "{b.notes}"
                </p>
              )}

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {b.status === 'AWAITING' || b.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => setActiveRequest(b)}
                      className="flex-1 py-2 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Review SLA Request (5m)</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'DECLINED')}
                      className="px-3 py-2 rounded-xl bg-[#FAF8F0] hover:bg-white text-[#4B5563] border border-[#E8E4D9] text-xs font-semibold cursor-pointer"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setOtpBooking(b)}
                      className="flex-1 py-2 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-white" />
                      <span>Verify Customer Delivery OTP</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                      className="px-3 py-2 rounded-xl bg-red-50 text-[#DC2626] hover:bg-red-100 border border-red-200 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* P-09: Incoming 5-Minute SLA Modal */}
      {activeRequest && (
        <IncomingRequestModal
          booking={activeRequest}
          onAccept={() => {
            setActiveRequest(null);
            loadProviderData();
          }}
          onReject={() => {
            setActiveRequest(null);
            loadProviderData();
          }}
          onClose={() => setActiveRequest(null)}
        />
      )}

      {/* P-11: Anti-Fraud OTP Completion Modal */}
      {otpBooking && (
        <BookingOtpModal
          booking={otpBooking}
          onSuccess={() => {
            setOtpBooking(null);
            loadProviderData();
          }}
          onClose={() => setOtpBooking(null)}
        />
      )}
    </div>
  );
};
