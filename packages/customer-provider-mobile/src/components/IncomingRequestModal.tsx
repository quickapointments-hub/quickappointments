import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { Bell, Clock, MapPin, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface IncomingRequestModalProps {
  booking: any;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
  booking,
  onAccept,
  onReject,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [rejecting, setRejecting] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Fully booked at this hour');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
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
        handleRejectAuto();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRejectAuto = async () => {
    try {
      await mobileApi.rejectBooking(booking.id, '5-minute provider response SLA expired');
      onReject();
    } catch (err) {
      console.error(err);
      onClose();
    }
  };

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await mobileApi.acceptBooking(booking.id);
      onAccept();
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectManual = async () => {
    try {
      setActionLoading(true);
      await mobileApi.rejectBooking(booking.id, selectedReason);
      onReject();
    } catch (err: any) {
      alert(`Reject failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const progressPct = (secondsRemaining / 300) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#FDFCF4] rounded-3xl p-6 shadow-2xl border border-[#E8E4D9] text-[#111111] space-y-5">
        {/* Urgent Header with 300s Countdown */}
        <div className="text-center space-y-2">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            {/* Countdown Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                className="text-[#E8E4D9]"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={213}
                strokeDashoffset={213 - (213 * progressPct) / 100}
                className={secondsRemaining < 60 ? 'text-[#DC2626]' : 'text-[#65B32E]'}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-base text-[#111111]">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] uppercase font-bold text-[#65B32E]">SLA Timer</span>
            </div>
          </div>

          <h3 className="font-black font-display text-base text-[#111111]">
            Incoming Appointment Request!
          </h3>
          <p className="text-xs text-[#4B5563] font-medium">Respond within 5 minutes or slot will be re-routed.</p>
        </div>

        {/* Appointment Details Box */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] space-y-2.5 text-xs shadow-sm">
          <div className="flex items-center justify-between font-bold text-[#111111] pb-2 border-b border-[#F2EFE8]">
            <span>{booking.service?.name}</span>
            <span className="text-[#65B32E] text-sm font-black font-display">₹{booking.providerEarnings || booking.totalAmount} net</span>
          </div>

          <div className="flex justify-between text-[#4B5563]">
            <span>Client</span>
            <span className="font-bold text-[#111111]">
              {booking.customer?.user?.fullName || 'Verified Client'}
            </span>
          </div>

          <div className="flex justify-between text-[#4B5563]">
            <span>Scheduled Date</span>
            <span className="font-bold text-[#111111]">{booking.date}</span>
          </div>

          <div className="flex justify-between text-[#4B5563]">
            <span>Time Window</span>
            <span className="font-mono font-bold text-[#111111]">
              {booking.startTime} - {booking.endTime}
            </span>
          </div>

          {booking.notes && (
            <div className="pt-2 border-t border-[#F2EFE8] text-[11px] text-[#4B5563] italic">
              "{booking.notes}"
            </div>
          )}
        </div>

        {/* Reject reason picker if rejecting */}
        {rejecting ? (
          <div className="space-y-3 animate-fadeIn">
            <label className="block text-xs font-bold text-[#111111]">Reason for decline:</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-[#DCD8C8] bg-white text-[#111111] font-bold focus:outline-none"
            >
              <option value="Fully booked at this hour">Fully booked at this hour</option>
              <option value="Location outside operating radius">Location outside operating radius</option>
              <option value="Staff emergency / Equipment maintenance">Staff emergency / Maintenance</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setRejecting(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-[#E8E4D9] text-[#4B5563] bg-white cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleRejectManual}
                disabled={actionLoading}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-50 text-[#DC2626] border border-red-200 shadow-sm cursor-pointer"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionLoading ? 'Accepting...' : 'Accept Appointment Request'}</span>
            </button>

            <button
              onClick={() => setRejecting(true)}
              className="w-full py-2.5 rounded-xl border border-[#E8E4D9] text-[#4B5563] hover:text-[#111111] text-xs font-semibold bg-white hover:bg-[#FAF8F0] transition-all cursor-pointer"
            >
              Decline Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
