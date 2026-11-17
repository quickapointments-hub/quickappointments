import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { QuickAppointmentsLogo } from '../../components/QuickAppointmentsLogo';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabase';
import {
  MapPin,
  Search,
  Bell,
  Sparkles,
  Scissors,
  Home,
  Wrench,
  Flower2,
  LayoutGrid,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { BookingModal } from '../../components/BookingModal';

const pickTopIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('hair')) return Scissors;
  if (n.includes('beauty') || n.includes('salon') || n.includes('skin')) return Sparkles;
  if (n.includes('clean')) return Home;
  if (n.includes('repair') || n.includes('plumb') || n.includes('ac')) return Wrench;
  if (n.includes('wellness') || n.includes('spa')) return Flower2;
  return LayoutGrid;
};

export const CustomerHomeScreen: React.FC<{
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  onOpenLocationModal?: () => void;
  onSelectCategory: (cat: any) => void;
  onNavigateToBookings: () => void;
  onOpenSearch?: () => void;
  onViewAllCategories?: () => void;
}> = ({
  selectedCity: propCity,
  onChangeCity,
  onOpenLocationModal,
  onSelectCategory,
  onNavigateToBookings,
  onOpenSearch,
  onViewAllCategories,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState(
    propCity || user?.customerProfile?.city || 'Hyderabad'
  );

  useEffect(() => {
    if (propCity) setSelectedCity(propCity);
  }, [propCity]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCities = async () => {
    try {
      const res = await mobileApi.getActiveCities();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCities(res.data);
        if (!res.data.some((c: any) => c?.name === selectedCity)) {
          setSelectedCity(res.data[0]?.name || 'Hyderabad');
        }
      }
    } catch (e) {
      console.warn('Error fetching cities:', e);
    }
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [catRes, servRes, provRes, banRes] = await Promise.all([
        mobileApi.getCategories().catch(() => ({ data: [] })),
        mobileApi.getServices().catch(() => ({ data: [] })),
        mobileApi.getProviders(selectedCity).catch(() => ({ data: [] })),
        mobileApi.getBanners().catch(() => ({ data: [] })),
      ]);
      setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
      setServices(Array.isArray(servRes?.data) ? servRes.data : []);
      setProviders(Array.isArray(provRes?.data) ? provRes.data : []);
      setBanners(Array.isArray(banRes?.data) ? banRes.data : []);
    } catch (err) {
      console.error('CustomerHome load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    loadHomeData();

    const unsubscribeSync = mobileApi.subscribeToSync((event) => {
      loadHomeData();
      if (event === 'cities_updated') loadCities();
      if (event === 'banners_updated' || event === 'catalog_updated') loadHomeData();
    });

    const channel = supabase
      .channel('customer-home-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, loadHomeData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, loadHomeData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, loadCities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, loadHomeData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, loadHomeData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, loadHomeData)
      .subscribe();

    return () => {
      unsubscribeSync();
      supabase.removeChannel(channel);
    };
  }, [selectedCity]);

  const activeBanners =
    banners.length > 0
      ? banners
      : [
          {
            id: 'hero-default',
            title: 'Book Trusted Local Services',
            subtitle: 'At Your Convenience',
            badge: 'Verified Specialists',
          },
        ];
  const currentBanner = activeBanners[activeBannerIdx % activeBanners.length] || activeBanners[0];

  return (
    <div className="pb-24 space-y-5 bg-[#FDFCF4] text-[#111111]">
      {/* Top Bar with Brand Logo & City Selector Pill */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <QuickAppointmentsLogo />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#111111] shadow-sm hover:border-[#16A34A] transition-colors cursor-pointer"
            title="Check postal pincode or change location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="truncate max-w-[110px]">{selectedCity}</span>
            <ChevronDown className="w-3 h-3 text-[#6B7280]" />
          </button>

          <button
            onClick={onNavigateToBookings}
            className="p-2 rounded-full bg-white border border-[#E8E4D9] text-[#111111] hover:text-[#16A34A] shadow-sm cursor-pointer"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-[#E8E4D9] text-left shadow-sm hover:border-[#16A34A] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4 text-[#6B7280] shrink-0" />
          <span className="text-xs text-[#6B7280] font-medium truncate">
            Search for services, providers...
          </span>
        </button>
      </div>

      {/* Hero Promotional Banner Carousel */}
      <div className="px-5 space-y-2">
        <div className="rounded-3xl p-5 bg-gradient-to-br from-[#F7FBE8] via-[#EFF8E7] to-[#E2F3D1] border border-[#DCECC9] shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-[235px] space-y-2">
            <h2 className="text-lg font-black font-display leading-tight text-[#111111]">
              {currentBanner.title}{' '}
              {banners.length === 0 && <span className="text-[#16A34A]">Local Services</span>}
            </h2>
            <p className="text-xs text-[#374151] font-medium">
              {currentBanner.subtitle || 'At Your Convenience'}
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {currentBanner.imageUrl && (
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="absolute right-0 bottom-0 h-full w-32 object-cover opacity-90 pointer-events-none"
            />
          )}
        </div>

        {activeBanners.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {activeBanners.map((b, idx) => (
              <button
                key={b.id || idx}
                onClick={() => setActiveBannerIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === activeBannerIdx % activeBanners.length
                    ? 'w-4 bg-[#16A34A]'
                    : 'w-1.5 bg-[#D1D5DB]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top Categories Strip */}
      <div className="px-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111111]">Top Categories</h3>
          <button
            onClick={onViewAllCategories || onOpenSearch}
            className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {categories.slice(0, 5).map((cat, idx) => {
            const Icon = pickTopIcon(cat.name);
            return (
              <button
                key={cat?.id || idx}
                onClick={() => onSelectCategory(cat)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-full aspect-square max-w-[60px] rounded-2xl bg-[#EFF8E7] border border-[#DCECC9] flex items-center justify-center text-[#16A34A] group-hover:border-[#16A34A] transition-colors">
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <span className="text-[10px] font-semibold text-[#111111] text-center leading-tight line-clamp-2">
                  {cat.name}
                </span>
              </button>
            );
          })}
          <button
            onClick={onViewAllCategories || onOpenSearch}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-full aspect-square max-w-[60px] rounded-2xl bg-[#EFF8E7] border border-[#DCECC9] flex items-center justify-center text-[#16A34A] group-hover:border-[#16A34A] transition-colors">
              <LayoutGrid className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-semibold text-[#111111] text-center leading-tight">
              More
            </span>
          </button>
        </div>
      </div>

      {/* Popular Services Horizontal Cards */}
      <div className="space-y-2.5">
        <div className="px-5 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111111]">Popular Services</h3>
          <button
            onClick={onOpenSearch}
            className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="px-5 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {services.length === 0 && !loading ? (
            <div className="w-full p-4 rounded-2xl bg-white border border-[#E8E4D9] text-xs text-[#6B7280] text-center">
              Services loading for {selectedCity}.
            </div>
          ) : (
            services.slice(0, 6).map((svc) => (
              <div
                key={svc.id}
                onClick={() => {
                  setSelectedService(svc);
                  setSelectedProvider(svc.provider || providers[0] || null);
                }}
                className="min-w-[168px] p-2.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm hover:border-[#16A34A] cursor-pointer flex items-center gap-2.5 transition-all shrink-0"
              >
                <div className="w-12 h-12 rounded-xl bg-[#EFF8E7] border border-[#DCECC9] flex items-center justify-center text-[#16A34A] shrink-0 font-bold text-xs">
                  {svc.name?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-[#111111] line-clamp-2 leading-snug">
                    {svc.name}
                  </h4>
                  <p className="text-[11px] font-bold text-[#16A34A] mt-0.5">
                    From ₹{svc.basePrice || 299}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Featured Providers */}
      <div className="px-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#111111]">Featured Providers</h3>
          <button
            onClick={onOpenSearch}
            className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[#6B7280]">Loading featured providers...</div>
        ) : providers.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-[#E8E4D9] space-y-1">
            <p className="text-xs font-bold text-[#111111]">No verified providers listed in {selectedCity}</p>
            <p className="text-[11px] text-[#4B5563]">Try switching city or exploring categories.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {providers.slice(0, 4).map((p) => (
              <div
                key={p?.id}
                className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm flex items-center justify-between gap-3 hover:border-[#16A34A] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#EFF8E7] border border-[#DCECC9] flex items-center justify-center font-black text-sm text-[#16A34A] shrink-0">
                    {(p?.businessName || p?.user?.fullName || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="font-bold text-xs text-[#111111] truncate">
                        {p?.businessName || p?.user?.fullName || 'Verified Provider'}
                      </h4>
                      {(p?.isVerified || p?.verificationStatus === 'APPROVED') && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] fill-[#EFF8E7] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#4B5563] truncate">
                      {p?.category?.name || p?.city || 'Local Specialist'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedProvider(p);
                    setSelectedService(
                      p?.services?.[0] ||
                        services[0] || {
                          id: undefined,
                          name: `${p?.businessName || 'Provider'} Consultation`,
                          basePrice: 499,
                          durationMinutes: 45,
                        }
                    );
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#EFF8E7] hover:bg-[#16A34A] text-[#16A34A] hover:text-white font-bold text-xs transition-colors shrink-0 cursor-pointer border border-[#DCECC9]"
                >
                  Book
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification reassurance strip */}
      <div className="px-5">
        <div className="p-3.5 rounded-2xl bg-[#EFF8E7] border border-[#DCECC9] flex items-center gap-2.5 text-[11px] text-[#111111]">
          <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span className="font-medium">
            Every active provider on Quick Appointments is KYC-verified by Admin.
          </span>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          provider={selectedProvider}
          onClose={() => {
            setSelectedService(null);
            setSelectedProvider(null);
          }}
          onSuccess={() => {
            setSelectedService(null);
            setSelectedProvider(null);
            onNavigateToBookings();
          }}
        />
      )}
    </div>
  );
};
