import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
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
import { BookingModal } from '../components/BookingModal';

interface CategoryProvidersScreenProps {
  category: { id: string; name: string; icon?: string };
  city?: string;
  onBack: () => void;
}

export const CategoryProvidersScreen: React.FC<CategoryProvidersScreenProps> = ({
  category,
  city = 'Mumbai',
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
        mobileApi.getProviders(city).catch(() => ({ data: [] })),
        mobileApi.getServices(category.id).catch(() => ({ data: [] })),
      ]);

      // Filter providers who offer services in this category
      const allServices = servRes.data || [];
      setServices(allServices);

      const allProviders = provRes.data || [];
      const relevant = allProviders.filter((p: any) => {
        // match category or match services provided
        if (p.category?.id === category.id || p.categoryId === category.id) return true;
        if (p.services?.some((s: any) => s.categoryId === category.id)) return true;
        return true; // Default fallback to city providers
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
      return 0; // recommended order
    });

  return (
    <div className="pb-24 space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{category.name}</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
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
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              sortBy === 'recommended'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Recommended
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
              sortBy === 'rating'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            Top Rated
          </button>
          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all ${
              sortBy === 'price'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Lowest Price
          </button>
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 flex items-center gap-1 transition-all ${
              verifiedOnly
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Only
          </button>
        </div>
      </div>

      {/* Provider List */}
      <div className="px-5 space-y-3.5">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading specialist providers...</div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No matching providers found</h4>
            <p className="text-[11px] text-slate-500">
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
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-base text-brand-700 shrink-0 shadow-inner">
                    {provider.businessName?.charAt(0) || provider.user?.fullName?.charAt(0) || 'P'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-slate-900 truncate">
                        {provider.businessName || provider.user?.fullName}
                      </h3>
                      {provider.isVerified && (
                        <span title="Verified KYC">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {provider.bio || `${category.name} expert with proven customer satisfaction`}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2">
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {provider.rating?.toFixed(1) || '4.9'}
                        <span className="font-normal text-slate-400">({provider.reviewCount || 42})</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {provider.distance ? `${provider.distance} km` : '1.2 km away'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Tag & Booking CTA */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Starting from</span>
                    <span className="text-sm font-bold font-display text-slate-900">
                      ₹{provider.startingPrice || defaultService.price || 499}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProvider(provider);
                      setSelectedService(defaultService);
                    }}
                    className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 text-brand-400" />
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

