import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
import {
  Search,
  X,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Sparkles,
  Scissors,
  Home,
  Wrench,
  Flower2,
  Refrigerator,
  Droplets,
} from 'lucide-react';
import { BookingModal } from '../../components/BookingModal';

interface SearchScreenProps {
  initialQuery?: string;
  selectedCity?: string;
  onSelectCategory?: (cat: any) => void;
  onViewAllCategories?: () => void;
  onClose: () => void;
}

const pickCatIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('hair')) return Scissors;
  if (n.includes('beauty') || n.includes('salon')) return Sparkles;
  if (n.includes('clean')) return Home;
  if (n.includes('appliance')) return Refrigerator;
  if (n.includes('repair')) return Wrench;
  if (n.includes('wellness') || n.includes('spa')) return Flower2;
  if (n.includes('plumb')) return Droplets;
  return LayoutGrid;
};

const RECENT_KEY = 'qa_recent_searches';

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  selectedCity = 'Hyderabad',
  onSelectCategory,
  onViewAllCategories,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Home Cleaning', 'Beauty & Salon', 'Plumbing'];
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  const trendingTags = ['Facial', 'Hair Spa', 'AC Repair', 'Deep Cleaning'];

  useEffect(() => {
    mobileApi.getCategories().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const persistSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

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
          mobileApi.getProviders(selectedCity, query.trim()).catch(() => ({ data: [] })),
        ]);
        setServices(servRes.data || []);
        setProviders(provRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedCity]);

  const removeRecent = (term: string) => {
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([]));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFCF4] text-[#111111] flex flex-col">
      {/* Brand & City Top Row */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <img src="/logo.png" alt="Quick Appointments" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#111111]">
            <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{selectedCity}</span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#4B5563] hover:text-[#111111] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Search Title & Input */}
      <div className="px-5 pt-1 pb-3 space-y-3 border-b border-[#E8E4D9]">
        <div>
          <h2 className="text-xl font-black font-display text-[#111111]">Search</h2>
          <p className="text-xs text-[#4B5563]">Find services, providers and more</p>
        </div>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') persistSearch(query);
            }}
            placeholder="Search for services, providers, categories..."
            className="w-full bg-white pl-10 pr-9 py-2.5 rounded-full text-xs font-semibold text-[#111111] placeholder:text-[#6B7280] outline-none focus:ring-2 focus:ring-[#16A34A]/20 border border-[#E8E4D9] focus:border-[#16A34A] shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 p-1 rounded-full text-[#6B7280] hover:text-[#111111] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {!query.trim() ? (
          <div className="space-y-5">
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-[#111111]">Recent Searches</span>
                  <button
                    onClick={clearRecent}
                    className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF8E7] border border-[#DCECC9] text-xs font-semibold text-[#111111]"
                    >
                      <Clock className="w-3 h-3 text-[#16A34A]" />
                      <button
                        onClick={() => setQuery(term)}
                        className="cursor-pointer hover:underline"
                      >
                        {term}
                      </button>
                      <button
                        onClick={() => removeRecent(term)}
                        className="text-[#4B5563] hover:text-[#111111] ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-[#111111] block mb-2.5">
                Trending Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      persistSearch(tag);
                      setQuery(tag);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-semibold text-[#111111] hover:border-[#16A34A] shadow-sm transition-all cursor-pointer"
                  >
                    <TrendingUp className="w-3 h-3 text-[#16A34A]" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[#111111]">Explore by Category</span>
                <button
                  onClick={() => {
                    onClose();
                    onViewAllCategories?.();
                  }}
                  className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {categories.slice(0, 7).map((cat) => {
                  const Icon = pickCatIcon(cat.name);
                  return (
                    <button
                      key={cat.id || cat.name}
                      onClick={() => {
                        onClose();
                        onSelectCategory?.(cat);
                      }}
                      className="p-2.5 rounded-2xl bg-[#EFF8E7] border border-[#DCECC9] flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#16A34A] cursor-pointer min-h-[82px]"
                    >
                      <Icon className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />
                      <span className="text-[10px] font-semibold text-[#111111] line-clamp-2 leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    onClose();
                    onViewAllCategories?.();
                  }}
                  className="p-2.5 rounded-2xl bg-[#EFF8E7] border border-[#DCECC9] flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#16A34A] cursor-pointer min-h-[82px]"
                >
                  <LayoutGrid className="w-5 h-5 text-[#16A34A] stroke-[1.8]" />
                  <span className="text-[10px] font-semibold text-[#111111]">More</span>
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">
            Searching services & providers...
          </div>
        ) : services.length === 0 && providers.length === 0 ? (
          <div className="py-16 text-center text-[#6B7280] space-y-2">
            <Search className="w-8 h-8 text-[#6B7280] mx-auto" />
            <p className="text-xs font-bold text-[#111111]">No results found for "{query}"</p>
            <p className="text-[11px] text-[#4B5563]">Try searching with a different keyword.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {services.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Services ({services.length})
                </h3>
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      onClick={() => {
                        persistSearch(query);
                        setSelectedService(svc);
                        setSelectedProvider(svc.provider || providers[0] || null);
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm hover:border-[#16A34A] cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="text-xs font-bold text-[#111111] truncate">{svc.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#4B5563]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#16A34A]" />
                            {svc.durationMinutes || 45} mins
                          </span>
                          <span>•</span>
                          <span className="text-[#4B5563] font-medium">
                            {svc.category?.name || 'Specialist'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black font-display text-[#111111] text-xs">
                          ₹{svc.basePrice || 499}
                        </span>
                        <span className="block text-[10px] text-[#16A34A] font-bold mt-0.5">
                          Book →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {providers.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">
                  Verified Providers ({providers.length})
                </h3>
                <div className="space-y-2">
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        persistSearch(query);
                        setSelectedProvider(p);
                        setSelectedService(
                          p.services?.[0] ||
                            services[0] || {
                              id: undefined,
                              name: `${p.businessName || 'Provider'} Consultation`,
                              basePrice: p.startingPrice || 499,
                              durationMinutes: 45,
                            }
                        );
                      }}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm hover:border-[#16A34A] cursor-pointer flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#EFF8E7] border border-[#DCECC9] flex items-center justify-center font-bold text-xs text-[#16A34A] shrink-0">
                          {(p.businessName || p.user?.fullName || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#111111] truncate">
                            {p.businessName || p.user?.fullName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-[#4B5563] mt-0.5">
                            <span className="flex items-center gap-0.5 font-bold text-[#111111]">
                              <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                              {Number(p.rating || p.ratingAvg || 4.8).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-[#6B7280]" />
                              {p.city || selectedCity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-[#16A34A]">
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
