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
        const lockoutTime = Date.now() + 15 * 60 * 1000;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#FDFCF4] rounded-3xl p-6 shadow-2xl border border-[#E8E4D9] text-[#111111] space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E4D9]">
          <div>
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#65B32E]" />
              <span>Verify & Complete Service</span>
            </h3>
            <p className="text-[11px] text-[#4B5563] font-mono">Ref: {booking.bookingRef}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer & Earnings Info */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] space-y-2 text-xs shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#4B5563]">Client Name:</span>
            <span className="font-bold text-[#111111]">
              {booking.customer?.user?.fullName || 'Client'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#4B5563]">Net Credit on Completion:</span>
            <span className="font-black text-[#65B32E] font-display text-sm">
              +₹{booking.providerEarnings || booking.totalAmount}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit Display */}
        <div className="text-center space-y-2">
          <p className="text-xs text-[#4B5563] font-medium">Ask client for their 6-digit Service OTP</p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-10 h-12 rounded-xl border flex items-center justify-center font-mono text-lg font-bold ${
                  otp[idx]
                    ? 'border-[#65B32E] bg-[#EFF8E7] text-[#111111]'
                    : 'border-[#DCD8C8] bg-white text-[#6B7280]'
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
                  className="py-3 text-xs font-bold rounded-2xl bg-white border border-[#E8E4D9] hover:bg-[#FAF8F0] text-[#4B5563] transition-all cursor-pointer"
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
                className="py-3 text-base font-bold font-mono rounded-2xl bg-white hover:bg-[#FAF8F0] border border-[#E8E4D9] text-[#111111] transition-all cursor-pointer shadow-sm"
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
          className="w-full py-3 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{verifying ? 'Verifying...' : 'Verify OTP & Complete Appointment'}</span>
        </button>
      </div>
    </div>
  );
};
