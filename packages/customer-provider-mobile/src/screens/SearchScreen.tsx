import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import {
  Search,
  X,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  History,
  Calendar,
} from 'lucide-react';
import { BookingModal } from '../components/BookingModal';

interface SearchScreenProps {
  initialQuery?: string;
  onClose: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', onClose }) => {
  const [query, setQuery] = useState(initialQuery);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const popularTags = [
    'Haircut & Styling',
    'AC Deep Cleaning',
    'Full Body Massage',
    'Dental Checkup',
    'Yoga Instructor',
    'House Painting',
  ];

  useEffect(() => {
    if (!query.trim()) {
      setServices([]);
      setProviders([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const [servRes, provRes] = await Promise.all([
          mobileApi.getServices(undefined, query.trim()).catch(() => ({ data: [] })),
          mobileApi.getProviders().catch(() => ({ data: [] })),
        ]);

        setServices(servRes.data || []);

        const q = query.toLowerCase();
        const matchedProviders = (provRes.data || []).filter((p: any) =>
          p.businessName?.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q)
        );
        setProviders(matchedProviders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 px-5 pt-4 pb-3 flex items-center gap-3">
        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search service, specialist or salon..."
            className="w-full bg-slate-100 pl-10 pr-9 py-2.5 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white border border-transparent focus:border-brand-500 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1"
        >
          Cancel
        </button>
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {!query.trim() ? (
          /* Popular / Recent Searches */
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-brand-500 hover:text-brand-600 shadow-xs transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-1">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Quick Booking Guarantee
              </span>
              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                All providers accept appointments within 300s SLA. Full 100% refund available up to 48 hours prior.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Searching services & providers...</div>
        ) : services.length === 0 && providers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No results found for "{query}"</p>
            <p className="text-[11px] text-slate-400">Try searching with a different keyword or category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Matching Services */}
            {services.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Services ({services.length})
                </h3>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => {
                        setSelectedService(svc);
                        setSelectedProvider(svc.provider || null);
                      }}
                      className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-sm cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{svc.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {svc.durationMinutes || 45} mins
                          </span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">
                            {svc.category?.name || 'Specialist'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold font-display text-slate-900 text-xs">
                          ₹{svc.basePrice || 499}
                        </span>
                        <span className="block text-[10px] text-brand-600 font-semibold mt-0.5">
                          Book →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Providers */}
            {providers.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Specialist Providers ({providers.length})
                </h3>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProvider(p);
                        setSelectedService(services[0] || {
                          id: 'svc-search',
                          name: `${p.businessName || 'Provider'} Service`,
                          price: p.startingPrice || 499,
                          duration: 45,
                        });
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-brand-500 cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-xs text-brand-700 shrink-0">
                          {p.businessName?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {p.businessName || p.user?.fullName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-slate-800">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {p.rating?.toFixed(1) || '4.9'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {p.city || 'Mumbai'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-slate-400">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal on Selection */}
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
            onClose();
          }}
        />
      )}
    </div>
  );
};

