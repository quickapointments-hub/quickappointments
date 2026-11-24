import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ChevronRight,
  Info,
  CreditCard,
  Building,
  Banknote,
  Smartphone,
  User,
} from 'lucide-react';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    serviceName: string;
    servicePrice: number;
    serviceDuration?: string;
    addOns: Array<{ id: string; name: string; price: number }>;
    scheduledDate: string;
    scheduledTime: string;
    address: string;
    providerName?: string;
  };
  onPaymentSuccess: (confirmedBooking: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
}) => {
  const [couponApplied, setCouponApplied] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING' | 'COD'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const bd = bookingData || ({} as any);
  const basePrice = Number(bd.servicePrice) || 499;
  const addOns = Array.isArray(bd.addOns) ? bd.addOns : [];
  const addOnsTotal = addOns.reduce((sum: number, item: any) => sum + (Number(item?.price) || 0), 0);
  const platformFee = 29;
  const taxes = 45;
  const promoDiscount = couponApplied ? 150 : 0;
  const totalPayable = Math.max(0, basePrice + addOnsTotal + platformFee + taxes - promoDiscount);
  const originalTotal = basePrice + addOnsTotal + platformFee + taxes;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess({
        id: `QA-${Math.floor(10000 + Math.random() * 90000)}`,
        bookingRef: `BK-${Math.floor(10000 + Math.random() * 90000)}`,
        serviceName: bd.serviceName || 'Split AC Deep Jet Servicing',
        totalAmount: totalPayable,
        date: bd.scheduledDate || 'Thursday, Oct 24',
        time: bd.scheduledTime || '03:00 PM - 04:00 PM',
        otp: `${Math.floor(1000 + Math.random() * 9000)}`,
        providerName: bd.providerName || 'Rajesh Kumar',
        address: bd.address || 'Flat 402, Green Glen Layout, Bellandur, Bangalore',
      });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] sm:bg-black/60 flex items-center justify-center p-0 sm:p-4 overflow-y-auto backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-[#FFFFFF] w-full max-w-md min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-[#E8E4D9]">
        {/* Header matching Screenshot 3 */}
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
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Checkout Booking</h1>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Checkout Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-28">
          {/* Progress Stepper Bar */}
          <div className="flex items-center justify-between px-2 py-2 bg-white rounded-2xl border border-slate-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A]">
              <span className="w-5 h-5 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>Slot Selected</span>
            </div>
            <div className="h-0.5 w-6 bg-[#16A34A]" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Review & Pay</span>
            </div>
            <div className="h-0.5 w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Done</span>
            </div>
          </div>

          {/* Scheduled Appointment Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 rounded-2xl border border-emerald-100 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-[#16A34A] flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Scheduled Appointment
              </span>
              <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">
                {bookingData.scheduledDate || 'Thursday, Oct 24'} • {bookingData.scheduledTime || '03:00 PM - 04:00 PM'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] font-bold text-[#16A34A]">Confirmed Instant Pro Slot</span>
              </div>
            </div>
          </div>

          {/* Service Address Card */}
          {/* Business Location to Visit Card (In-Person Marketplace) */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-100">
                <MapPin className="w-4 h-4 text-[#16A34A]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Home</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">Default</span>
                  <span className="text-xs font-bold text-slate-900">Business Center</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">Physical Visit</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {bookingData.address || 'Flat 402, Green Glen Layout, Bellandur, Bangalore'}
                </p>
              </div>
            </div>
            <button className="text-xs font-bold text-[#16A34A] hover:underline shrink-0 cursor-pointer pt-0.5">
              Change
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                bookingData.address || 'Indiranagar, Bangalore'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#16A34A] hover:underline shrink-0 cursor-pointer pt-0.5"
            >
              Map
            </a>
          </div>

          {/* Service Details Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Details</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                1 Service • {addOns.length} Add-on
              </span>
            </div>

            {/* Main Service Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&auto=format&fit=crop&q=80"
                  alt="Service"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">
                    {bd.serviceName || 'Split AC Deep Jet Servicing'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">High pressure indoor & outdoor jet clean</p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1">
                    Qty: 1 • {bd.serviceDuration || '45 mins'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-slate-900">₹{basePrice}</span>
            </div>

            {/* Add-on items */}
            {addOns.map((add: any) => (
              <div
                key={add.id}
                className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">{add.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    Add-on
                  </span>
                </div>
                <span className="text-xs font-black text-slate-900 shrink-0">₹{add.price}</span>
              </div>
            ))}
          </div>

          {/* Offers & Coupons Box */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Tag className="w-4 h-4 text-[#16A34A]" />
                <span>Offers & Coupons</span>
              </div>
              <button className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer">
                View All
              </button>
            </div>

            {couponApplied ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#16A34A]">QUICK150</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#16A34A] text-white">APPLIED</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">You save ₹150 with this code!</p>
                  </div>
                </div>
                <button
                  onClick={() => setCouponApplied(false)}
                  className="text-xs font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCouponApplied(true)}
                className="w-full py-2 px-3 border border-dashed border-[#16A34A] rounded-xl text-xs font-bold text-[#16A34A] hover:bg-emerald-50 transition-colors text-center cursor-pointer"
              >
                Apply code 'QUICK150' to save ₹150
              </button>
            )}
          </div>

          {/* Itemized Bill Details Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Bill Details</h4>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Base Service Cost</span>
                <span className="font-semibold text-slate-900">₹{basePrice}</span>
              </div>

              {addOnsTotal > 0 && (
                <div className="flex justify-between">
                  <span>Add-on ({bookingData.addOns[0]?.name || 'Upgrade'})</span>
                  <span className="font-semibold text-slate-900">₹{addOnsTotal}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <span>Platform Convenience Fee</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </span>
                <span className="font-semibold text-slate-900">₹{platformFee}</span>
              </div>

              <div className="flex justify-between">
                <span>Taxes & GST (18%)</span>
                <span className="font-semibold text-slate-900">₹{taxes}</span>
              </div>

              {couponApplied && (
                <div className="flex justify-between text-[#16A34A] font-bold">
                  <span>Promo Discount (QUICK150)</span>
                  <span>-₹{promoDiscount}</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Payable</span>
                <span className="text-lg font-black text-slate-900 leading-tight">₹{totalPayable}</span>
              </div>
              {couponApplied && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold shadow-2xs">
                  Total Savings: ₹{promoDiscount}
                </span>
              )}
            </div>
          </div>

          {/* 48-Hour 100% Refund SLA Guarantee Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/80 shadow-2xs flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#16A34A] text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-slate-900">Quick 48-Hour 100% Refund SLA Guarantee</h5>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                Unhappy with the servicing? Free rework or full refund within 48 hours. Free cancellation up to 2 hours before the scheduled appointment.
              </p>
            </div>
          </div>

          {/* Select Payment Method Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Select Payment Method</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Lock className="w-3 h-3 text-[#16A34A]" />
                <span>256-bit Encrypted</span>
              </span>
            </div>

            <div className="space-y-2">
              {/* Option 1: UPI */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'UPI'
                    ? 'border-[#16A34A] bg-emerald-50/40 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">UPI Options</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#16A34A] text-white">Fastest</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, QR</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'UPI' ? 'border-[#16A34A] bg-[#16A34A]' : 'border-slate-300'
                    }`}
                >
                  {paymentMethod === 'UPI' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option 2: Cards */}
              <div
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'CARD'
                    ? 'border-[#16A34A] bg-emerald-50/40 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Credit / Debit Card</span>
                    <p className="text-[10px] text-slate-500">Visa, Mastercard, RuPay & Diners</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-[#16A34A] bg-[#16A34A]' : 'border-slate-300'
                    }`}
                >
                  {paymentMethod === 'CARD' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option 3: Net Banking */}
              <div
                onClick={() => setPaymentMethod('NET_BANKING')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'NET_BANKING'
                    ? 'border-[#16A34A] bg-emerald-50/40 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Net Banking</span>
                    <p className="text-[10px] text-slate-500">All major Indian banks supported</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'NET_BANKING' ? 'border-[#16A34A] bg-[#16A34A]' : 'border-slate-300'
                    }`}
                >
                  {paymentMethod === 'NET_BANKING' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>

              {/* Option 4: Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'COD'
                    ? 'border-[#16A34A] bg-emerald-50/40 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Cash on Delivery</span>
                    <p className="text-[10px] text-slate-500">Pay cash or UPI after service completion</p>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-[#16A34A] bg-[#16A34A]' : 'border-slate-300'
                    }`}
                >
                  {paymentMethod === 'COD' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar matching Screenshot 3 */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-[#E8E4D9] p-4 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">₹{totalPayable}</span>
                <span className="text-xs text-slate-400 line-through">₹{originalTotal}</span>
              </div>
              <button className="text-[10px] font-bold text-[#16A34A] hover:underline block cursor-pointer">
                View Price Breakup
              </button>
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 max-w-[220px] py-3 px-5 rounded-2xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <span>{isProcessing ? 'Confirming...' : `Pay ₹${totalPayable}`}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          <div className="text-center flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>100% Secure Payment • Safe & Verified Urban Pros</span>
          </div>
        </div>
      </div>
    </div>
  );
};
