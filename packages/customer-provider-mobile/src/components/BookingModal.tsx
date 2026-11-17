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
import { AwaitingProviderModal } from './AwaitingProviderModal';
import { AlternativeProvidersModal } from './AlternativeProvidersModal';

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
  // Step 2.5: Awaiting Provider SLA
  // Step 3: Checkout Summary & Confirmed Ticket

  const [selectedProvider, setSelectedProvider] = useState<any>(provider || null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [awaitingBooking, setAwaitingBooking] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

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
  const [countdownSeconds, setCountdownSeconds] = useState(300); // 5 minutes (Provider SLA window)

  // Notes & Payment
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_SERVICE' | 'RAZORPAY'>('CASH_ON_SERVICE');
  const [confirming, setConfirming] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Razorpay Mock Simulation State
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [mockPayment, setMockPayment] = useState<{
    txnId: string;
    orderId: string;
    amount: number;
    dateTime: string;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setValidatingCoupon(true);
      setCouponError(null);
      const res = await mobileApi.validateCoupon(couponCode.trim(), service.basePrice);
      if (res.valid) {
        setCouponDiscount(res.discountAmount || 0);
        setCouponSuccess(`Coupon ${res.coupon?.code || couponCode.toUpperCase()} applied! You save ₹${res.discountAmount}`);
      } else {
        setCouponError(res.message || 'Invalid coupon code');
        setCouponDiscount(0);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
      setCouponDiscount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // 5-Minute Lock Countdown Timer (Provider Acceptance SLA based on server timestamp)
  useEffect(() => {
    if (!reservation) return;

    const calculateRemaining = () => {
      if (reservation.expiresAt) {
        const diff = Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000);
        return Math.max(0, diff);
      }
      return 300;
    };

    setCountdownSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setCountdownSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setLockError('5-minute reservation hold expired. Please select a slot again or choose an alternative provider.');
        setReservation(null);
        setStep(1);
      }
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

  // Confirm Booking strictly via Backend API (no local fake booking fallback)
  const handleConfirmBooking = async (paymentData?: { txnId: string; orderId: string; amount: number; dateTime: string }) => {
    if (!reservation) return;
    try {
      setConfirming(true);
      const chosenPaymentMethod = paymentData ? 'RAZORPAY' : paymentMethod;
      const res = await mobileApi.confirmBooking(
        reservation.id,
        chosenPaymentMethod,
        notes,
        paymentData?.txnId,
        paymentData?.orderId
      );
      const resBooking = res.data;
      if (!resBooking) {
        throw new Error('Booking confirmation returned empty payload.');
      }
      setConfirmedBooking(resBooking);
      // Initiate 5-minute provider SLA state
      setAwaitingBooking(resBooking);
    } catch (err: any) {
      alert(`Booking confirmation failed: ${err.message}`);
    } finally {
      setConfirming(false);
    }
  };

  // Create Payment Order via Backend Razorpay integration
  const handlePayWithRazorpay = async () => {
    try {
      setSimulatingPayment(true);
      const subtotal = service.basePrice;
      const taxes = Math.round(subtotal * 0.05);
      const totalAmount = Math.max(0, subtotal + taxes - couponDiscount);
      const orderRes = await mobileApi.createPaymentOrder(totalAmount, reservation?.id);
      const order = orderRes?.data || orderRes;
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ', ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      setMockPayment({
        txnId: order?.paymentId || order?.razorpayPaymentId || `pay_${order?.id || Date.now()}`,
        orderId: order?.id || order?.orderId || `order_${Date.now()}`,
        amount: order?.amount ? Number(order.amount) / (order?.currency === 'INR' && Number(order.amount) > totalAmount * 10 ? 100 : 1) : totalAmount,
        dateTime: formattedDate,
      });
      setStep(2.5);
    } catch (err: any) {
      alert(`Payment order creation failed: ${err.message}`);
    } finally {
      setSimulatingPayment(false);
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
              {step === 3
                ? 'Appointment Confirmed! 🎉'
                : step === 2.5
                  ? 'Payment Successful'
                  : 'Book Appointment'}
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
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${selectedProvider?.id === p.id
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
                      className={`py-2 px-1 text-xs rounded-xl font-bold font-mono transition-all text-center ${!s.isAvailable
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
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">
                  ₹{Math.max(0, service.basePrice + Math.round(service.basePrice * 0.05) - couponDiscount)}
                </span>
              </div>
            </div>

            {/* Apply Promo / Coupon Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Have a Coupon Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  placeholder="e.g. QUICK50, WELCOME100"
                  className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {validatingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 font-bold">{couponSuccess}</p>
              )}
              {couponError && (
                <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
              )}
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
                  className={`p-3 rounded-xl border text-left font-semibold flex items-center gap-2 ${paymentMethod === 'CASH_ON_SERVICE'
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
                  className={`p-3 rounded-xl border text-left font-semibold flex items-center gap-2 ${paymentMethod === 'RAZORPAY'
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600'
                    }`}
                >
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  <span>Razorpay / UPI</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'RAZORPAY' ? (
              <button
                type="button"
                onClick={handlePayWithRazorpay}
                disabled={simulatingPayment || confirming}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {simulatingPayment ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Simulating Razorpay Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay Now ₹{Math.max(0, service.basePrice + Math.round(service.basePrice * 0.05) - couponDiscount)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmBooking()}
                disabled={confirming}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{confirming ? 'Securing Appointment...' : 'Confirm Appointment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 2.5: Mock Razorpay Payment Success Screen */}
        {step === 2.5 && mockPayment && (
          <div className="space-y-4 py-2 animate-fadeIn">
            {/* Payment Success Checkmark & Badges */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold font-display text-base text-slate-900">
                  Payment Successful
                </h4>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Razorpay Mock Sandbox • Captured</span>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Payment Amount</span>
                <span className="font-bold text-base text-brand-600">
                  ₹{mockPayment.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Mock Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {mockPayment.txnId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono font-medium text-slate-700">
                  {mockPayment.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Payment Date & Time</span>
                <span className="font-medium text-slate-700">
                  {mockPayment.dateTime}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-800">
                  UPI / Cards (Razorpay Simulated)
                </span>
              </div>
            </div>

            {/* Development Mock Notice */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-800 text-[11px] space-y-0.5">
              <p className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulated Sandbox Transaction</span>
              </p>
              <p className="text-amber-700 leading-relaxed">
                This is a mock transaction in the development environment. No real payment gateway was contacted and no funds were debited.
              </p>
            </div>

            {/* Navigation to Booking Confirmation & Ticket */}
            <button
              onClick={() => handleConfirmBooking(mockPayment)}
              disabled={confirming}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{confirming ? 'Generating Appointment Ticket...' : 'View Appointment Ticket & Service OTP'}</span>
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

            {/* Anti-Fraud 6-Digit Customer OTP Display (C-08) */}
            <div className="p-4 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] text-center space-y-1 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#65B32E]" />
                <span>6-Digit Service Delivery OTP</span>
              </span>
              <div className="font-mono text-2xl font-black text-[#111111] tracking-widest py-0.5">
                {confirmedBooking.serviceOtp || '------'}
              </div>
              <p className="text-[10px] text-[#4B5563] font-medium">
                Keep this code secure. Share it with your specialist only upon completed service delivery.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F0] border border-[#E8E4D9] text-xs text-left space-y-1.5">
              <p className="text-[#4B5563]">
                <span className="font-bold text-[#111111]">Service:</span> {service.name}
              </p>
              <p className="text-[#4B5563]">
                <span className="font-bold text-[#111111]">Scheduled:</span>{' '}
                {confirmedBooking.date} @ {confirmedBooking.startTime}
              </p>
              <p className="text-[#4B5563]">
                <span className="font-bold text-[#111111]">Total Charged:</span> ₹
                {confirmedBooking.totalAmount}
              </p>
            </div>

            <button
              onClick={() => {
                onSuccess(confirmedBooking);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Done & View Appointments
            </button>
          </div>
        )}

        {/* C-07: Awaiting Provider 5-Minute SLA Modal */}
        {awaitingBooking && (
          <AwaitingProviderModal
            booking={awaitingBooking}
            onAccepted={(b) => {
              setConfirmedBooking(b);
              setAwaitingBooking(null);
              setStep(3);
              onSuccess(b);
            }}
            onDeclinedOrExpired={() => {
              setAwaitingBooking(null);
              setShowAlternatives(true);
            }}
            onCancelAndRefund={() => {
              setAwaitingBooking(null);
              onClose();
            }}
          />
        )}

        {/* C-11: Alternative Providers Re-Routing Modal */}
        {showAlternatives && (
          <AlternativeProvidersModal
            booking={confirmedBooking || { id: 'temp', serviceId: service.id }}
            onSelectAlternative={(altProvider) => {
              setShowAlternatives(false);
              setSelectedProvider(altProvider);
              setStep(1);
            }}
            onClose={() => {
              setShowAlternatives(false);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

