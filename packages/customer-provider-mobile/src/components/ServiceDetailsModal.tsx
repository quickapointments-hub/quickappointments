import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  User,
  Plus,
  Check,
  Star,
  Zap,
} from 'lucide-react';

export interface ServiceDetailsModalProps {
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onBookNow?: (service: any) => void;
  onProceedToCheckout?: (data: {
    serviceName: string;
    servicePrice: number;
    serviceDuration?: string;
    addOns: Array<{ id: string; name: string; price: number }>;
    scheduledDate: string;
    scheduledTime: string;
    address: string;
    providerName?: string;
  }) => void;
}

const DATES = [
  { day: 'Wed', date: '23', full: 'Wednesday, Oct 23' },
  { day: 'Thu', date: '24', full: 'Thursday, Oct 24' },
  { day: 'Fri', date: '25', full: 'Friday, Oct 25' },
  { day: 'Sat', date: '26', full: 'Saturday, Oct 26' },
  { day: 'Sun', date: '27', full: 'Sunday, Oct 27' },
];

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
  onProceedToCheckout,
}) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState(1); // Thu 24
  const [selectedSlot, setSelectedSlot] = useState('03:00 PM');
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [dispatchMode, setDispatchMode] = useState<'AUTO' | 'SPECIFIC'>('AUTO');

  // Add-ons selection state
  const [antiRustSelected, setAntiRustSelected] = useState(false);
  const [gasTopupSelected, setGasTopupSelected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const s = service || {};
  const basePrice = Number(s.price || s.basePrice) || 499;
  const originalPrice = 699;
  const discountPercent = Math.max(0, Math.round(((originalPrice - basePrice) / originalPrice) * 100));

  const addOnsList: Array<{ id: string; name: string; price: number }> = [];
  if (antiRustSelected) {
    addOnsList.push({ id: 'add-1', name: 'Anti-Rust Coil Coating', price: 149 });
  }
  if (gasTopupSelected) {
    addOnsList.push({ id: 'add-2', name: 'Pure Gas Top-Up (1kg)', price: 450 });
  }

  const addOnsTotal = addOnsList.reduce((sum, item) => sum + item.price, 0);
  const currentTotal = basePrice + addOnsTotal;

  const handleProceed = () => {
    if (onProceedToCheckout) {
      onProceedToCheckout({
        serviceName: s.name || 'Split AC Deep Jet Servicing',
        servicePrice: basePrice,
        serviceDuration: s.duration || '45-60 mins',
        addOns: addOnsList,
        scheduledDate: DATES[selectedDateIdx]?.full || 'Thursday, Oct 24',
        scheduledTime: `${selectedSlot} - 04:00 PM`,
        address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore',
        providerName: 'Rajesh Kumar',
      });
    } else if (onBookNow) {
      onBookNow(s);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFFFF] sm:bg-black/60 flex items-center justify-center p-0 sm:p-4 overflow-y-auto backdrop-blur-xs animate-fadeIn font-sans">
      <div className="bg-[#FFFFFF] w-full max-w-md min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl border-0 sm:border sm:border-[#E8E4D9]">
        {/* Header matching Screenshot 2 */}
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
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Provider Details</h1>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Scrollable Service Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
          {/* Hero Service Card matching Screenshot 2 */}
          <div className="rounded-3xl overflow-hidden relative shadow-md bg-slate-900 text-white">
            <div className="relative h-44 w-full">
              <img
                src={
                  service.imageUrl ||
                  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'
                }
                alt={service.name}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[10px] font-extrabold uppercase tracking-wider">
                    VETTED EXPERT
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <span>★ 4.9</span>
                    <span className="text-slate-300 font-normal">(1,480 bookings)</span>
                  </span>
                </div>

                <h2 className="text-lg font-black tracking-tight leading-tight">
                  {service.name || 'Split AC Deep Jet Servicing'}
                </h2>

                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="text-xl font-black text-white">₹{basePrice}</span>
                  <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#16A34A] text-white">
                    {discountPercent}% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Highlights Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Duration</span>
                <span className="text-xs font-extrabold text-slate-800 truncate">45–60 mins</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Warranty</span>
                <span className="text-xs font-extrabold text-slate-800 truncate">30-Day Cover</span>
              </div>
            </div>
          </div>

          {/* What's Included (4-Step Procedure matching Screenshot 2) */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">What's Included</h3>
              <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                4 - Step Procedure
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-extrabold text-slate-900">Indoor unit foam jet cleaning</span> with intense 2x high-pressure pump wash.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-extrabold text-slate-900">Outdoor condenser clearance</span> removing deep mud, leaf debris & coil clogs.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-extrabold text-slate-900">Freon gas level diagnostic</span> with full digital cooling efficiency report.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <span className="font-extrabold text-slate-900">10-point electrical safety scan</span> including PCB voltage and earthing test.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Upgrades (Optional Add-ons matching Screenshot 2) */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Recommended Upgrades
              </h3>
              <span className="text-[10px] font-semibold text-slate-400">Optional Add-ons</span>
            </div>

            {/* Add-on 1 */}
            <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Anti-Rust Coil Coating</h4>
                  <p className="text-[10px] text-slate-400 truncate">Prevents corrosive salt leakages</p>
                  <span className="text-xs font-black text-[#16A34A] mt-0.5 block">+₹149</span>
                </div>
              </div>

              <button
                onClick={() => setAntiRustSelected(!antiRustSelected)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  antiRustSelected
                    ? 'bg-[#16A34A] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {antiRustSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>

            {/* Add-on 2 */}
            <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Pure Gas Top-Up (1kg)</h4>
                  <p className="text-[10px] text-slate-400 truncate">OEM Grade R32 / R410A refrigerant</p>
                  <span className="text-xs font-black text-[#16A34A] mt-0.5 block">+₹450</span>
                </div>
              </div>

              <button
                onClick={() => setGasTopupSelected(!gasTopupSelected)}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  gasTopupSelected
                    ? 'bg-[#16A34A] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {gasTopupSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SELECT APPOINTMENT (Interactive Calendar matching Screenshot 2) */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  SELECT APPOINTMENT
                </span>
                <h3 className="text-sm font-black text-slate-900">October 2024</h3>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 rounded-full hover:bg-slate-100 text-slate-600 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Day Tabs */}
            <div className="grid grid-cols-5 gap-2">
              {DATES.map((d, idx) => {
                const isSelected = idx === selectedDateIdx;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDateIdx(idx)}
                    className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-80">{d.day}</span>
                    <span className="text-sm font-black mt-0.5">{d.date}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mt-1" />}
                  </button>
                );
              })}
            </div>

            {/* Slots categorization */}
            <div className="space-y-3 pt-2">
              {/* Morning */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                  <span>🌅 MORNING</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['08:00 AM', '09:30 AM', '11:00 AM'].map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSelectedPeriod('morning');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {slot === '09:30 AM' && !isSelected && (
                          <span className="absolute -top-1.5 right-1 px-1 py-0.2 rounded text-[8px] font-extrabold bg-[#16A34A] text-white">
                            FAST
                          </span>
                        )}
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                  <span>☀️ AFTERNOON</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['01:30 PM', '03:00 PM', '04:30 PM'].map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSelectedPeriod('afternoon');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border relative flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evening */}
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mb-1.5">
                  <span>🌙 EVENING</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['06:00 PM', '07:30 PM', '09:00 PM'].map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setSelectedPeriod('evening');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border relative flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Specialist & Staff Selection Section (Physical In-Person Visit) */}
          <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Specialist & Staff Selection
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
                <CheckCircle2 className="w-3 h-3" />
                <span>In-Store Visit</span>
              </span>
            </div>

            {/* Toggle Segment */}
            <div className="p-1 bg-slate-100 rounded-2xl grid grid-cols-2 gap-1 text-center">
              <button
                onClick={() => setDispatchMode('AUTO')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  dispatchMode === 'AUTO'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div>Any Available Pro</div>
                <div className="text-[9px] font-medium text-[#16A34A]">Fastest Slot Booking</div>
              </button>

              <button
                onClick={() => setDispatchMode('SPECIFIC')}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  dispatchMode === 'SPECIFIC'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div>Choose Specialist</div>
                <div className="text-[9px] font-medium text-slate-400">View Staff Profiles</div>
              </button>
            </div>

            {/* Selected Specialist Card */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-100/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&auto=format&fit=crop&q=80"
                    alt="Rajesh Kumar"
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#16A34A] ring-2 ring-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">Rajesh Kumar</h4>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#16A34A] text-white">
                      Top Rated
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    ★ 4.96 • Senior Specialist & Staff Lead
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded-lg shrink-0">
                Available In-Store
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Bar matching Screenshot 2 */}
        <div className="sticky bottom-0 z-20 bg-white border-t border-[#E8E4D9] p-4 shadow-lg flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">₹{currentTotal}</span>
              <span className="text-xs font-bold text-slate-500">total</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
              <span>{DATES[selectedDateIdx]?.day} {DATES[selectedDateIdx]?.date} • {selectedSlot}</span>
              <Info className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <button
            onClick={handleProceed}
            className="flex-1 max-w-[220px] py-3 px-5 rounded-2xl bg-slate-900 hover:bg-black active:scale-[0.98] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
