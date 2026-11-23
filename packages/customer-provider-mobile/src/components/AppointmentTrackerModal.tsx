import React, { useState } from 'react';
import {
  ArrowLeft,
  Bike,
  ShieldCheck,
  Phone,
  MessageSquare,
  Calendar,
  HelpCircle,
  XCircle,
  CheckCircle2,
  Copy,
  Check,
  User,
  Snowflake,
  MapPin,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export interface AppointmentTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: any;
  onReschedule?: (booking: any) => void;
  onCancel?: (booking: any) => void;
  onOpenSupport?: () => void;
}

export const AppointmentTrackerModal: React.FC<AppointmentTrackerModalProps> = ({
  isOpen,
  onClose,
  booking,
  onReschedule,
  onCancel,
  onOpenSupport,
}) => {
  const [copied, setCopied] = useState(false);
  const [callingPro, setCallingPro] = useState(false);
  const [chattingPro, setChattingPro] = useState(false);

  if (!isOpen) return null;

  const b = booking || {};
  const bookingId = b.id || b.bookingRef || '#QA-88219';
  const serviceName = b.serviceName || b.service?.name || 'Dual AC Jet Pump Deep Clean';
  const price = b.totalAmount || b.price || 1499;
  const rawOtp = String(b.otp ?? b.serviceOtp ?? '7492');
  const otpDigits = rawOtp.replace(/\D/g, '').padEnd(4, '0').split('').slice(0, 4);
  const proName = b.providerName || b.provider?.businessName || 'Rajesh Kumar';

  const handleCopyOtp = () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(otpDigits.join(''));
      }
    } catch {
      // fallback if clipboard API not permitted
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFCF4] sm:bg-black/60 flex items-center justify-center p-0 sm:p-4 overflow-y-auto backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-[#FDFCF4] w-full max-w-md min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-[#E8E4D9]">
        {/* Top Header matching Screenshot 4 */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-[#E8E4D9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1 text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <img src="/splash-logo.png" alt="Logo" className="h-6 w-auto object-contain" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Appointment Tracker</h1>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Appointment Pass & Visit Guide */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
          {/* Confirmed Appointment & Physical Location Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
            {/* Header Status Bar */}
            <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-50">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#16A34A] text-xs font-bold border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>CONFIRMED APPOINTMENT</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">REF: {bookingId}</span>
            </div>

            {/* Visit Details info */}
            <div className="p-4 pt-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Physical Business Visit</h2>
                <p className="text-xs text-slate-500 mt-0.5">Please arrive 5–10 mins prior to scheduled slot</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shadow-2xs">
                <MapPin className="w-6 h-6 stroke-[1.9]" />
              </div>
            </div>

            {/* Business Location & Map Navigation Card */}
            <div className="relative mx-4 h-44 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80"
                alt="Business Map Location"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

              {/* Tag top left */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Verified Business Location</span>
              </div>

              {/* Destination Tag bottom with Navigation CTA */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="text-[11px] font-bold text-slate-900 truncate">
                    {b.address || 'Flat 402, Green Glen Layout, Bellandur, Bangalore'}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    b.address || 'Indiranagar, Bangalore'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded text-[10px] font-extrabold bg-[#16A34A] hover:bg-[#15803D] text-white flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Directions</span>
                  <span className="text-xs">›</span>
                </a>
              </div>
            </div>

            {/* In-Person Appointment Progress Timeline */}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Appointment Timeline</span>
                <span className="font-semibold text-slate-400">Step 2 of 5</span>
              </div>

              {/* Progress Line */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                <div className="h-1.5 rounded-full bg-[#16A34A]" />
                <div className="h-1.5 rounded-full bg-[#16A34A]" />
                <div className="h-1.5 rounded-full bg-slate-200" />
                <div className="h-1.5 rounded-full bg-slate-200" />
                <div className="h-1.5 rounded-full bg-slate-200" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-0.5">
                <span className="text-[#16A34A] font-bold">✓ Booked</span>
                <span className="text-[#16A34A] font-bold">✓ Confirmed</span>
                <span>Check-in</span>
                <span>In Service</span>
                <span>Done</span>
              </div>
            </div>
          </div>

          {/* Customer On-Site Check-In Pass */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50/40 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Customer Check-in Pass</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Present this pass code at the <span className="font-bold text-slate-900">Front Desk / Reception</span> upon your arrival.
                </p>
              </div>
            </div>

            {/* 4 Large Digit Boxes */}
            <div className="flex items-center justify-center gap-3 py-1">
              {otpDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className="w-12 h-14 bg-white rounded-2xl border-2 border-slate-200 text-slate-900 font-black text-2xl flex items-center justify-center shadow-sm select-all"
                >
                  {digit}
                </div>
              ))}
            </div>

            {/* Copy OTP Button */}
            <button
              onClick={handleCopyOtp}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#16A34A]" />
                  <span className="text-[#16A34A]">Pass Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Check-in Code</span>
                </>
              )}
            </button>

            {/* Info Callout */}
            <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100 text-[10px] text-slate-600 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Your physical appointment session begins once the front desk validates your check-in code.
              </span>
            </div>
          </div>

          {/* Assigned Specialist & Business Details Card */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Assigned Specialist & Business
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                <ShieldCheck className="w-3 h-3 text-[#16A34A]" />
                <span>Verified Business Center</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=140&auto=format&fit=crop&q=80"
                  alt="Pro"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#16A34A]"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px] ring-2 ring-white">
                  ✓
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">{proName}</h4>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[9px]">
                    ✓
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Lead Specialist & Stylist</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-1">
                  <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">★ 4.96</span>
                  <span>• 640+ appointments</span>
                  <span>• Vetted Staff</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Call & Directions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="tel:+919876543210"
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200/80 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Call Center</span>
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  b.address || 'Indiranagar, Bangalore'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200/80 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Navigate</span>
              </a>
            </div>
          </div>

          {/* Booked Service Item */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <Snowflake className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{serviceName}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Includes 30-day Post Service Guarantee</p>
              </div>
            </div>
            <span className="text-xs font-black text-slate-900 shrink-0">₹{price}</span>
          </div>

          {/* Action Navigation Rows */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            <button
              onClick={() => onReschedule?.(b)}
              className="w-full p-3.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Reschedule Appointment</span>
              </div>
              <span className="text-slate-400 text-sm">›</span>
            </button>

            <button
              onClick={onOpenSupport}
              className="w-full p-3.5 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Quick Support & FAQs</span>
              </div>
              <span className="text-slate-400 text-sm">›</span>
            </button>

            <button
              onClick={() => onCancel?.(b)}
              className="w-full p-3.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>Cancel Booking</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800">
                100% Refund SLA
              </span>
            </button>
          </div>

          {/* Insured Guarantee Footer */}
          <div className="text-center flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Quick Appointments Safe & Insured Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
