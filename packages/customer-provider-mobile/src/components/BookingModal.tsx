import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface BookingModalProps {
  service: any;
  provider?: any;
  onClose: () => void;
  onSuccess: (booking: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  provider,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  // Step 1: Select Date & Provider
  // Step 2: Select Slot & Concurrency Lock
  // Step 3: Checkout Summary & Payment Confirm

  const [selectedProvider, setSelectedProvider] = useState<any>(provider || null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  
  // Date calculation: Default tomorrow (or next open weekday)
  const getNextAvailableDate = () => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip Sunday if closed
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getNextAvailableDate());
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Reservation Lock
  const [reservation, setReservation] = useState<any>(null);
  const [reserving, setReserving] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(600); // 10 minutes

  // Notes & Payment
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_SERVICE' | 'RAZORPAY'>('CASH_ON_SERVICE');
  const [confirming, setConfirming] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // 10-Minute Lock Countdown Timer
  useEffect(() => {
    if (!reservation) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLockError('Reservation hold expired. Please select a slot again.');
          setReservation(null);
          setStep(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [reservation]);

  // Load available providers if not provided
  useEffect(() => {
    if (!selectedProvider) {
      loadProviders();
    }
  }, []);

  const loadProviders = async () => {
    try {
      const res = await mobileApi.getProviders();
      setAvailableProviders(res.data || []);
      if (res.data?.length > 0) {
        setSelectedProvider(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load slots when provider or date changes
  useEffect(() => {
    if (selectedProvider && selectedDate) {
      loadSlots();
    }
  }, [selectedProvider, selectedDate]);

  const loadSlots = async () => {
    try {
      setLoadingSlots(true);
      setSelectedSlot(null);
      setLockError(null);
      const res = await mobileApi.getProviderSlots(selectedProvider.id, selectedDate);
      setSlots(res.data || []);
    } catch (err: any) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Hold 10-minute temporary reservation lock (Concurrency Check)
  const handleHoldSlot = async (slotTime: string) => {
    try {
      setReserving(true);
      setLockError(null);
      const res = await mobileApi.reserveSlot(
        selectedProvider.id,
        service.id,
        selectedDate,
        slotTime
      );
      setSelectedSlot(slotTime);
      setReservation(res.reservation);
      setCountdownSeconds(600); // 10 mins
      setStep(2); // Proceed to checkout review
    } catch (err: any) {
      setLockError(err.message || 'Slot currently held by another user');
    } finally {
      setReserving(false);
    }
  };

  // Confirm Booking
  const handleConfirmBooking = async () => {
    if (!reservation) return;
    try {
      setConfirming(true);
      const res = await mobileApi.confirmBooking(reservation.id, paymentMethod, notes);
      setConfirmedBooking(res.data);
      setStep(3); // Confirmation screen
      onSuccess(res.data);
    } catch (err: any) {
      alert(`Booking confirmation failed: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  const minutesRemaining = Math.floor(countdownSeconds / 60);
  const secondsRemaining = countdownSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {step === 3 ? 'Appointment Confirmed! 🎉' : 'Book Appointment'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Date & Time Slot Matrix */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Provider Selector if multiple */}
            {availableProviders.length > 1 && !provider && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Provider
                </label>
                <div className="space-y-1.5">
                  {availableProviders.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                        selectedProvider?.id === p.id
                          ? 'border-brand-500 bg-brand-50/50 font-bold text-brand-800'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{p.businessName || p.user?.fullName}</span>
                      <span className="text-[11px] text-slate-400">★ {p.ratingAvg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Appointment Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Slot Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Available Time Slots
                </label>
                <span className="text-[10px] text-slate-400">
                  {slots.filter((s) => s.isAvailable).length} open
                </span>
              </div>

              {lockError && (
                <div className="p-3 mb-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{lockError}</span>
                </div>
              )}

              {loadingSlots ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Checking schedule & existing bookings...
                </div>
              ) : slots.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  Provider is closed on this day. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s, idx) => (
                    <button
                      key={idx}
                      disabled={!s.isAvailable || reserving}
                      onClick={() => handleHoldSlot(s.time)}
                      className={`py-2 px-1 text-xs rounded-xl font-bold font-mono transition-all text-center ${
                        !s.isAvailable
                          ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed border border-slate-100'
                          : 'bg-white border border-slate-200 hover:border-brand-500 text-slate-800 hover:bg-brand-50 shadow-sm'
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Selecting a slot holds it for 10 minutes to guarantee zero double bookings.
            </p>
          </div>
        )}

        {/* STEP 2: Checkout Summary & 10-Minute Lock Active */}
        {step === 2 && reservation && (
          <div className="space-y-4">
            {/* Concurrency Timer Banner */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span className="font-semibold text-amber-900">Slot Reserved Exclusively:</span>
              </div>
              <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                {String(minutesRemaining).padStart(2, '0')}:{String(secondsRemaining).padStart(2, '0')}
              </span>
            </div>

            {/* Order Review Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{service.name}</span>
                <span>₹{service.basePrice}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Provider</span>
                <span>{selectedProvider?.businessName || selectedProvider?.user?.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Slot Time</span>
                <span className="font-mono font-semibold text-slate-900">
                  {reservation.date} @ {reservation.startTime}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST / Taxes (5%)</span>
                <span>₹{Math.round(service.basePrice * 0.05)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">
                  ₹{service.basePrice + Math.round(service.basePrice * 0.05)}
                </span>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please bring sanitizer, master stylist requested..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH_ON_SERVICE')}
                  className={`p-3 rounded-xl border text-left font-semibold flex items-center gap-2 ${
                    paymentMethod === 'CASH_ON_SERVICE'
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>Pay on Service</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('RAZORPAY')}
                  className={`p-3 rounded-xl border text-left font-semibold flex items-center gap-2 ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  <span>Razorpay / UPI</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={confirming}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{confirming ? 'Securing Appointment...' : 'Confirm Appointment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Confirmed Success */}
        {step === 3 && confirmedBooking && (
          <div className="text-center space-y-4 py-4 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-bold font-display text-base text-slate-900">
                Booking Reference Confirmed!
              </h4>
              <p className="font-mono text-xs font-bold text-brand-600 mt-1">
                {confirmedBooking.bookingRef}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5">
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">Service:</span> {service.name}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">Scheduled:</span>{' '}
                {confirmedBooking.date} @ {confirmedBooking.startTime}
              </p>
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">Total Charged:</span> ₹
                {confirmedBooking.totalAmount}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold"
            >
              Done & View Appointments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

