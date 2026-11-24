import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { Clock, ShieldCheck, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface AwaitingProviderModalProps {
  booking: any;
  onAccepted: (booking: any) => void;
  onDeclinedOrExpired: () => void;
  onCancelAndRefund: () => void;
}

export const AwaitingProviderModal: React.FC<AwaitingProviderModalProps> = ({
  booking,
  onAccepted,
  onDeclinedOrExpired,
  onCancelAndRefund,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const bookingsRes = await mobileApi.getCustomerBookings();
        const current = (bookingsRes.data || []).find((b: any) => b.id === booking.id);
        if (current) {
          if (current.status === 'CONFIRMED') {
            clearInterval(pollInterval);
            onAccepted(current);
          } else if (current.status === 'DECLINED' || current.status === 'EXPIRED') {
            clearInterval(pollInterval);
            onDeclinedOrExpired();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 4000);

    const calculateRemaining = () => {
      if (booking?.createdAt) {
        const expiresAt = new Date(booking.createdAt).getTime() + 300 * 1000;
        return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      }
      return 300;
    };

    setSecondsRemaining(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        clearInterval(pollInterval);
        onDeclinedOrExpired();
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, [booking.id]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#FFFFFF] rounded-3xl p-6 shadow-2xl border border-[#E8E4D9] text-[#111111] text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#EFF8E7] border border-[#65B32E] text-[#65B32E] flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8 animate-pulse text-[#65B32E]" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-[#111111] bg-[#EFF8E7] px-2.5 py-0.5 rounded-full border border-[#65B32E]">
            5-Minute Specialist SLA Active
          </span>
          <h3 className="font-bold font-display text-lg text-[#111111] mt-2">
            Awaiting Specialist Confirmation
          </h3>
          <p className="text-xs text-[#4B5563] mt-1 max-w-xs mx-auto font-medium">
            Your specialist has 5 minutes to confirm availability. Your slot is exclusively held.
          </p>
        </div>

        {/* Big Countdown Clock */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm">
          <div className="font-mono text-3xl font-black text-[#111111]">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-[#4B5563] font-semibold">Auto-reroutes if unaccepted</span>
        </div>

        {/* Provider Brief */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] text-xs text-left space-y-1">
          <p className="text-[#4B5563]">
            <span className="font-bold text-[#111111]">Specialist:</span>{' '}
            {booking.provider?.businessName || booking.provider?.user?.fullName}
          </p>
          <p className="text-[#4B5563]">
            <span className="font-bold text-[#111111]">Slot:</span> {booking.date} @ {booking.startTime}
          </p>
        </div>

        {/* Cancel link */}
        <button
          onClick={onCancelAndRefund}
          className="text-xs font-bold text-[#DC2626] hover:underline transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Cancel and release authorization</span>
        </button>
      </div>
    </div>
  );
};
