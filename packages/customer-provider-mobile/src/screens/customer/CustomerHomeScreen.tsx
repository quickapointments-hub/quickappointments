import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import {
  MapPin,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  SlidersHorizontal,
  Calendar,
  Snowflake,
  Wrench,
  Droplets,
  Sparkles,
  Scissors,
  Hammer,
  Paintbrush,
  Video,
  User,
  Star,
  CheckCircle2,
  FileCheck,
  Receipt,
  Phone,
} from 'lucide-react';
import { ServiceDetailsModal } from '../../components/ServiceDetailsModal';
import { CheckoutModal } from '../../components/CheckoutModal';
import { AppointmentTrackerModal } from '../../components/AppointmentTrackerModal';

export const CustomerHomeScreen: React.FC<{
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  onOpenLocationModal?: () => void;
  onSelectCategory: (cat: any) => void;
  onNavigateToBookings: () => void;
  onOpenSearch?: () => void;
  onViewAllCategories?: () => void;
  onOpenProfile?: () => void;
}> = ({
  selectedCity: propCity,
  onChangeCity,
  onOpenLocationModal,
  onSelectCategory,
  onNavigateToBookings,
  onOpenSearch,
  onViewAllCategories,
  onOpenProfile,
}) => {
    const { user } = useAuth();
    const [selectedCity, setSelectedCity] = useState(
      propCity || user?.customerProfile?.city || 'Indiranagar, Bangalore'
    );

    useEffect(() => {
      if (propCity) setSelectedCity(propCity);
    }, [propCity]);

    // Modal flow states matching Screenshots 1, 2, 3, 4
    const [serviceDetailsOpen, setServiceDetailsOpen] = useState(false);
    const [selectedServiceData, setSelectedServiceData] = useState<any>(null);

    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutBookingData, setCheckoutBookingData] = useState<any>(null);

    const [trackerOpen, setTrackerOpen] = useState(false);
    const [activeTrackingBooking, setActiveTrackingBooking] = useState<any>(null);

    // Standard 8 Marketplace Business Categories matching Master Prompt
    const EXPLORE_CATEGORIES = [
      { id: 'salon', name: 'Beauty & Salon', icon: Scissors, isPopular: true },
      { id: 'health', name: 'Healthcare & Clinic', icon: CheckCircle2 },
      { id: 'education', name: 'Coaching & Tuition', icon: FileCheck },
      { id: 'fitness', name: 'Gym & Fitness', icon: Zap },
      { id: 'photo', name: 'Photo Studio', icon: Video },
      { id: 'dance', name: 'Dance & Music', icon: Sparkles },
      { id: 'spa', name: 'Spa & Wellness', icon: Droplets },
      { id: 'auto', name: 'Auto Center', icon: Wrench },
    ];

    const handleOpenDefaultService = () => {
      setSelectedServiceData({
        id: 'srv-ac-1',
        name: 'Split AC Deep Jet Servicing',
        basePrice: 499,
        duration: '45–60 mins',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
      });
      setServiceDetailsOpen(true);
    };

    const handleProceedToCheckout = (data: any) => {
      setServiceDetailsOpen(false);
      setCheckoutBookingData(data);
      setCheckoutOpen(true);
    };

    const handlePaymentSuccess = (confirmedBooking: any) => {
      setCheckoutOpen(false);
      setActiveTrackingBooking(confirmedBooking);
      setTrackerOpen(true);
    };

    return (
      <div className="pb-28 space-y-4 bg-[#FFFFFF] text-[#111111] font-sans">
        {/* Top Header matching Screenshot 1 */}
        <div className="px-4 pt-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <img
              src="/splash-logo.png"
              alt="Quick Appointments"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                // fallback if not found
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Location Dropdown with Pin */}
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="flex flex-col items-center cursor-pointer text-center max-w-[170px]"
          >
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 truncate">
              QUICK APPOINTMENTS
            </span>
            <div className="flex items-center gap-1 text-xs font-black text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              <span className="truncate">{selectedCity}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            </div>
          </button>

          {/* Right Controls: Bell (2) & Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToBookings}
              className="relative p-2 rounded-full bg-white border border-[#E8E4D9] text-slate-700 hover:text-[#16A34A] shadow-2xs cursor-pointer"
              title="Bookings & Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                2
              </span>
            </button>

            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
              title="My Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar matching Screenshot 1 */}
        <div className="px-4">
          <div
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full bg-white border border-[#E8E4D9] text-left shadow-2xs hover:border-[#16A34A] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium truncate">
                Search "AC service", "Electric...
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSearch?.();
                }}
                className="p-1 hover:text-slate-700 cursor-pointer"
                title="Voice Search"
              >
                <Mic className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSearch?.();
                }}
                className="p-1 hover:text-slate-700 cursor-pointer"
                title="Filter"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#16A34A]" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Offer Banner matching Screenshot 1 */}
        <div className="px-4 space-y-2">
          <div className="rounded-3xl p-5 bg-[#1E293B] text-white shadow-lg relative overflow-hidden">
            {/* Top Pill & Pagination number */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[#4ADE80] text-[10px] font-extrabold border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-[#4ADE80]" />
                <span>100% REFUND SLA GUARANTEE</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">1 of 3</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 z-10 max-w-[210px]">
                <span className="text-xs font-black tracking-wider text-[#4ADE80] block">
                  LIMITED OFFER
                </span>
                <h2 className="text-xl font-black text-white leading-tight">
                  Flat ₹150 OFF
                </h2>
                <p className="text-xs text-slate-300 font-medium">on 1st Home Service</p>

                <button
                  onClick={handleOpenDefaultService}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#22C55E] hover:bg-[#16A34A] text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Calendar Graphic Illustration */}
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center p-2 shadow-inner shrink-0">
                <div className="w-full h-3 bg-white/30 rounded-t-lg mb-1 flex items-center justify-around px-1">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-xs ${i === 4 ? 'bg-[#22C55E]' : 'bg-white/40'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Pagination dots */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              <span className="w-4 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          </div>
        </div>

        {/* Express Appointment Booking Banner (In-Person Center Visit) */}
        <div className="px-4">
          <div className="rounded-2xl p-3 bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D] text-white shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-black text-[#22C55E] flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-black/40 text-white">
                    INSTANT SLOTS
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
                <h4 className="text-xs font-black truncate mt-0.5">Physical Center Appointments</h4>
                <p className="text-[10px] text-white/90 truncate">Guaranteed slots today • Zero waiting time</p>
              </div>
            </div>

            <button
              onClick={handleOpenDefaultService}
              className="px-3 py-1.5 rounded-full bg-black hover:bg-slate-900 text-white text-xs font-black shadow-sm shrink-0 transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Book Slot</span>
              <span className="text-[10px]">›</span>
            </button>
          </div>
        </div>

        {/* Explore Services 8 Categories matching Screenshot 1 */}
        <div className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 tracking-tight">Explore Services</h3>
              <p className="text-[10px] text-slate-500 font-medium">Vetted experts ready today</p>
            </div>
            <button
              onClick={onViewAllCategories || onOpenSearch}
              className="text-xs font-bold text-[#16A34A] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all</span>
              <span>›</span>
            </button>
          </div>

          {/* 2 Rows of 4 Cards */}
          <div className="grid grid-cols-4 gap-2.5">
            {EXPLORE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'ac') {
                      handleOpenDefaultService();
                    } else {
                      onSelectCategory({ id: cat.id, name: cat.name });
                    }
                  }}
                  className="relative bg-white rounded-2xl border border-slate-100 p-2.5 shadow-2xs hover:border-[#16A34A] transition-all flex flex-col items-center justify-center text-center cursor-pointer group active:scale-95"
                >
                  {/* Popular Badge */}
                  {cat.isPopular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-[#16A34A] text-white text-[8px] font-black uppercase tracking-wider shadow-2xs">
                      POPULAR
                    </span>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-emerald-50/70 border border-emerald-100/60 text-[#16A34A] flex items-center justify-center group-hover:bg-[#16A34A] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800 mt-1.5 truncate w-full">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Verified Pros Near You matching Screenshot 1 */}
        <div className="space-y-2 pt-1">
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <h3 className="font-black text-sm text-slate-900 tracking-tight">Top Verified Pros Near You</h3>
            </div>
            <span className="text-[9px] font-black tracking-wider text-[#16A34A] uppercase">
              LIVE AVAILABILITY
            </span>
          </div>

          <div className="px-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {/* Card 1: Electrician */}
            <div className="min-w-[210px] w-[210px] bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col shrink-0">
              <div className="relative h-28 w-full bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80"
                  alt="Rajesh Kumar"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-extrabold text-slate-800">
                  ★ 4.96 (620+)
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 truncate">Rajesh Kumar</h4>
                  <p className="text-[10px] text-slate-500 truncate">Master Electrician & AC Pro</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[10px] text-slate-400">Starting</span>
                    <span className="text-xs font-black text-slate-900">₹199</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenDefaultService}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>

            {/* Card 2: Cleaning Pro */}
            <div className="min-w-[210px] w-[210px] bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col shrink-0">
              <div className="relative h-28 w-full bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80"
                  alt="Anita Sharma"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-extrabold text-slate-800">
                  ★ 4.91 (480+)
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 truncate">Anita Sharma</h4>
                  <p className="text-[10px] text-slate-500 truncate">Home Sanitization Expert</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[10px] text-slate-400">Starting</span>
                    <span className="text-xs font-black text-slate-900">₹299</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedServiceData({
                      id: 'srv-clean-1',
                      name: 'Deep Home Sanitization Package',
                      basePrice: 299,
                      duration: '60–90 mins',
                      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
                    });
                    setServiceDetailsOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Slot</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Trust Badges matching Screenshot 1 */}
        <div className="px-4 pt-2">
          <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs grid grid-cols-3 divide-x divide-slate-100 text-center">
            <div className="px-1 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900 leading-tight">100% Refund</span>
              <span className="text-[9px] text-slate-400 font-medium">48-Hr SLA</span>
            </div>

            <div className="px-1 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-1">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900 leading-tight">Background Checked</span>
              <span className="text-[9px] text-slate-400 font-medium">100% Verified</span>
            </div>

            <div className="px-1 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-1">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-900 leading-tight">Fixed Pricing</span>
              <span className="text-[9px] text-slate-400 font-medium">Zero Hidden Cost</span>
            </div>
          </div>
        </div>

        {/* SCREEN 2: Service Details & Slot Selection Modal */}
        {serviceDetailsOpen && (
          <ServiceDetailsModal
            service={selectedServiceData}
            isOpen={serviceDetailsOpen}
            onClose={() => setServiceDetailsOpen(false)}
            onProceedToCheckout={handleProceedToCheckout}
          />
        )}

        {/* SCREEN 3: Checkout Booking Modal */}
        {checkoutOpen && (
          <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            bookingData={checkoutBookingData}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {/* SCREEN 4: Live Appointment Tracker Modal */}
        {trackerOpen && (
          <AppointmentTrackerModal
            isOpen={trackerOpen}
            onClose={() => setTrackerOpen(false)}
            booking={activeTrackingBooking}
            onReschedule={() => {
              alert('Reschedule requested: Selecting new slot within SLA window.');
            }}
            onCancel={() => {
              alert('100% Refund SLA cancellation initiated. Admin refund desk notified.');
              setTrackerOpen(false);
            }}
            onOpenSupport={() => {
              alert('Connecting you with Quick Appointments Support Desk.');
            }}
          />
        )}
      </div>
    );
  };
