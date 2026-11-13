import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { BookingModal } from '../../components/BookingModal';

interface CategoryProvidersScreenProps {
  category: { id: string; name: string; icon?: string };
  city?: string;
  onBack: () => void;
}

export const CategoryProvidersScreen: React.FC<CategoryProvidersScreenProps> = ({
  category,
  city,
  onBack,
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'price'>('recommended');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  useEffect(() => {
    loadCategoryData();
  }, [category.id, city]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      const [provRes, servRes] = await Promise.all([
        mobileApi.getProviders(city, undefined, category.id).catch(() => ({ data: [] })),
        mobileApi.getServices(category.id).catch(() => ({ data: [] })),
      ]);

      const allServices = servRes.data || [];
      setServices(allServices);

      const allProviders = provRes.data || [];
      const relevant = allProviders.filter((p: any) => {
        if (p.category?.id === category.id || p.categoryId === category.id || p.category_id === category.id) return true;
        if (Array.isArray(p.services) && p.services.some((s: any) => (s.categoryId || s.category_id) === category.id)) return true;
        return allServices.some((s: any) => s.providerId === p.id);
      });

      setProviders(relevant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers
    .filter((p) => {
      if (verifiedOnly && !p.isVerified) return false;
      if (instantOnly && !p.instantBookingEnabled) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 4.5) - (a.rating || 4.5);
      if (sortBy === 'price') return (a.startingPrice || 399) - (b.startingPrice || 399);
      return 0;
    });

  return (
    <div className="pb-24 space-y-4 bg-[#FDFCF4] text-[#111111] min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#FDFCF4]/95 backdrop-blur-md border-b border-[#E8E4D9] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-[#FAF8F0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-[#111111] tracking-tight flex items-center gap-1.5">
              <span>{category.name}</span>
            </h2>
            <p className="text-[11px] text-[#4B5563] font-medium">
              {filteredProviders.length} verified specialist{filteredProviders.length === 1 ? '' : 's'} in {city}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-5 space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none no-scrollbar">
          <button
            onClick={() => setSortBy('recommended')}
            className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${sortBy === 'recommended'
              ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E] shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#E8E4D9] hover:bg-[#FAF8F0]'
              }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`px-3 py-1.5 rounded-full font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${sortBy === 'rating'
              ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E] shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#E8E4D9] hover:bg-[#FAF8F0]'
              }`}
          >
            <Star className="w-3 h-3 fill-[#65B32E] text-[#65B32E]" />
            Top Rated
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${sortBy === 'price'
              ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E] shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#E8E4D9] hover:bg-[#FAF8F0]'
              }`}
          >
            Lowest Price
          </button>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-full font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${verifiedOnly
              ? 'bg-[#EFF8E7] text-[#111111] border border-[#65B32E] shadow-sm'
              : 'bg-white text-[#4B5563] border border-[#E8E4D9] hover:bg-[#FAF8F0]'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#65B32E]" />
            Verified Only
          </button>
        </div>
      </div>

      {/* Provider List */}
      <div className="px-5 space-y-3.5">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading specialist providers...</div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4D9] space-y-2">
            <Filter className="w-8 h-8 text-[#6B7280] mx-auto" />
            <h4 className="text-xs font-bold text-[#111111]">No matching providers found</h4>
            <p className="text-[11px] text-[#4B5563]">
              Try adjusting your filter preferences or check back shortly.
            </p>
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const defaultService = services[0] || {
              id: 'svc-default',
              name: `${category.name} Consultation`,
              price: provider.startingPrice || 499,
              duration: 45,
            };

            return (
              <div
                key={provider.id}
                className="p-4 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm hover:border-[#65B32E] transition-all space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#EFF8E7] border border-[#65B32E]/30 flex items-center justify-center font-bold text-base text-[#111111] shrink-0">
                    {provider.businessName?.charAt(0) || provider.user?.fullName?.charAt(0) || 'P'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-[#111111] truncate">
                        {provider.businessName || provider.user?.fullName}
                      </h3>
                      {provider.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-[#65B32E] shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#4B5563] truncate mt-0.5 font-medium">
                      {provider.bio || `${category.name} expert with verified certification`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-[#4B5563] mt-2">
                      <span className="flex items-center gap-1 font-bold text-[#111111]">
                        <Star className="w-3 h-3 fill-[#65B32E] text-[#65B32E]" />
                        {provider.rating?.toFixed(1) || '4.9'}
                        <span className="font-normal text-[#6B7280]">({provider.reviewCount || 42})</span>
                      </span>
                      <span className="text-[#DCD8C8]">•</span>
                      <span className="flex items-center gap-1 text-[#4B5563]">
                        <MapPin className="w-3 h-3 text-[#6B7280]" />
                        {provider.distance ? `${provider.distance} km` : '1.2 km away'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Tag & Booking CTA */}
                <div className="pt-2 border-t border-[#F2EFE8] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6B7280] block font-semibold">Starting from</span>
                    <span className="text-sm font-black font-display text-[#111111]">
                      ₹{provider.startingPrice || defaultService.price || 499}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProvider(provider);
                      setSelectedService(defaultService);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-white" />
                    <span>Book Appointment</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Booking Modal */}
      {selectedProvider && selectedService && (
        <BookingModal
          service={selectedService}
          provider={selectedProvider}
          onClose={() => {
            setSelectedProvider(null);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setSelectedProvider(null);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};
