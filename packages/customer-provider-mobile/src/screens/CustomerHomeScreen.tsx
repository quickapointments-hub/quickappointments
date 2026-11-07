import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Search,
  Bell,
  Star,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { BookingModal } from '../components/BookingModal';

export const CustomerHomeScreen: React.FC<{
  onSelectCategory: (cat: any) => void;
  onNavigateToBookings: () => void;
}> = ({ onSelectCategory, onNavigateToBookings }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [selectedCity]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [catRes, servRes, provRes] = await Promise.all([
        mobileApi.getCategories().catch(() => ({ data: [] })),
        mobileApi.getServices().catch(() => ({ data: [] })),
        mobileApi.getProviders(selectedCity).catch(() => ({ data: [] })),
      ]);
      setCategories(catRes.data || []);
      setServices(servRes.data || []);
      setProviders(provRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((s) =>
    searchQuery ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="pb-24 space-y-5">
      {/* Top Bar with Brand Logo & City Picker */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Quick Appointments" className="h-8 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent font-medium text-xs focus:outline-none cursor-pointer"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          <button
            onClick={onNavigateToBookings}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="px-5">
        <div className="bg-charcoal-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-charcoal-800">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[10px] font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Instant Appointment Confirmation</span>
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight text-white">
              Hello, {user?.fullName || 'Valued Client'} 👋
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-[240px]">
              Book top verified specialists in minutes with zero double-booking friction.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15 pointer-events-none">
            <img src="/logo.png" alt="" className="w-36 h-36 object-contain" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hair styling, facial, doctor, AC repair..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
          />
        </div>
      </div>

      {/* 4 Launch Categories (Phase 6.4) */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900">Explore Services</h3>
          <span className="text-[11px] font-semibold text-brand-600">4 Launch Tiers</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={cat.id || idx}
              onClick={() => onSelectCategory(cat)}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-brand-500 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <span className="w-7 h-7 rounded-xl bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs mb-2">
                  0{cat.displayOrder || idx + 1}
                </span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{cat.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{cat.description}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-brand-600">
                <span>View options</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Bookable Services */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900">Popular Services</h3>
          <span className="text-[11px] font-semibold text-slate-400">Available Today</span>
        </div>

        <div className="space-y-2.5">
          {filteredServices.slice(0, 4).map((service) => (
            <div
              key={service.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between hover:border-brand-400 transition-all"
            >
              <div className="max-w-[210px]">
                <h4 className="font-bold text-xs text-slate-900">{service.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-900">
                    <Clock className="w-3 h-3 text-brand-600" />
                    {service.durationMinutes}m
                  </span>
                  <span>•</span>
                  <span className="font-bold text-brand-700">₹{service.basePrice}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedService(service)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Verified Providers */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-900">Top Verified Providers</h3>
          <span className="text-[11px] font-semibold text-slate-400">KYC Approved</span>
        </div>

        <div className="space-y-3">
          {providers.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 font-bold flex items-center justify-center text-sm">
                  {(p.businessName || p.user?.fullName || 'P').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-slate-900">
                      {p.businessName || p.user?.fullName}
                    </h4>
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {p.city} • {p.experienceYears}y experience
                  </p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{p.ratingAvg}</span>
                    <span className="text-slate-400 font-normal">({p.ratingCount} reviews)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedProvider(p);
                  setSelectedService(services[0]);
                }}
                className="px-3 py-1.5 rounded-xl border border-brand-500 text-brand-700 font-bold text-xs hover:bg-brand-50 transition-all"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Booking Modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          provider={selectedProvider}
          onClose={() => {
            setSelectedService(null);
            setSelectedProvider(null);
          }}
          onSuccess={(b) => {
            // refresh data
            loadHomeData();
          }}
        />
      )}
    </div>
  );
};

