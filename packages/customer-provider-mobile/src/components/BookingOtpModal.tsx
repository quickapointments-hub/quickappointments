import React, { useState } from 'react';
import { mobileApi } from '../api';
import { KeyRound, CheckCircle2, X, Phone, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';

interface BookingOtpModalProps {
  booking: any;
  onSuccess: () => void;
  onClose: () => void;
}

export const BookingOtpModal: React.FC<BookingOtpModalProps> = ({
  booking,
  onSuccess,
  onClose,
}) => {
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = lockedUntil ? Date.now() < lockedUntil : false;

  const handleKeyPress = (num: string) => {
    if (isLocked || otp.length >= 6) return;
    setOtp((prev) => prev + num);
  };

  const handleDelete = () => {
    if (isLocked) return;
    setOtp((prev) => prev.slice(0, -1));
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit Customer OTP');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      await mobileApi.verifyServiceOtp(booking.id, otp);
      onSuccess();
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 15 * 60 * 1000; // 15-minute lockout
        setLockedUntil(lockoutTime);
        setError('Too many incorrect attempts. Screen locked for 15 minutes for customer security.');
      } else {
        setError(`Invalid verification OTP (${5 - newAttempts} attempts remaining)`);
      }
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Verify & Complete Service</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Ref: {booking.bookingRef}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer & Earnings Info */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Client Name:</span>
            <span className="font-bold text-slate-900">
              {booking.customer?.user?.fullName || 'Client'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Net Credit on Completion:</span>
            <span className="font-bold text-brand-700 font-display text-sm">
              +₹{booking.providerEarnings || booking.totalAmount}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit Display */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500 font-medium">Ask client for their 6-digit Service OTP</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-lg font-bold ${
                  otp[idx]
                    ? 'border-brand-500 bg-brand-50/50 text-slate-900'
                    : 'border-slate-200 bg-slate-50 text-slate-300'
                }`}
              >
                {otp[idx] || '•'}
              </div>
            ))}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((key, i) => {
            if (key === '') return <div key={i} />;
            if (key === 'DEL') {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={handleDelete}
                  className="py-3 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                >
                  DEL
                </button>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="py-3 text-base font-bold font-mono rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Verify CTA */}
        <button
          onClick={handleVerify}
          disabled={otp.length !== 6 || verifying || isLocked}
          className="w-full py-3 rounded-xl bg-charcoal-900 hover:bg-black text-white font-bold text-xs shadow-lg shadow-charcoal-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{verifying ? 'Verifying...' : 'Verify OTP & Complete Appointment'}</span>
        </button>
      </div>
    </div>
  );
};

