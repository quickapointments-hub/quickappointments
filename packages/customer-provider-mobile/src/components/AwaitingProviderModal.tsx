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
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 300 seconds (5 min SLA)

  // 5-second polling check for provider acceptance
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

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(pollInterval);
          onDeclinedOrExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, [booking.id]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8 animate-pulse text-brand-600" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            5-Minute Provider SLA Active
          </span>
          <h3 className="font-bold font-display text-lg text-slate-900 mt-2">
            Awaiting Provider Confirmation
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your specialist has 5 minutes to confirm availability. Your payment authorization is held securely.
          </p>
        </div>

        {/* Big Countdown Clock */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="font-mono text-3xl font-black text-slate-900">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Auto-reroutes if unaccepted</span>
        </div>

        {/* Provider Brief */}
        <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-left space-y-1">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">Specialist:</span>{' '}
            {booking.provider?.businessName || booking.provider?.user?.fullName}
          </p>
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">Slot:</span> {booking.date} @ {booking.startTime}
          </p>
        </div>

        {/* Cancel link */}
        <button
          onClick={onCancelAndRefund}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Cancel and release authorization</span>
        </button>
      </div>
    </div>
  );
};

