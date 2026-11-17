import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
import {
  Search,
  X,
  MapPin,
  Clock,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { BookingModal } from '../../components/BookingModal';
import { ServiceDetailsModal } from '../../components/ServiceDetailsModal';
import { QuickAppointmentsLogo } from '../../components/QuickAppointmentsLogo';
import {
  IconBeautyFace,
  IconScissors,
  IconHomeCleaning,
  IconHomeRepair,
  IconWellnessLotus,
  IconWashingMachine,
  IconPlumbingTap,
  IconAirConditioner,
  IconCarCare,
  IconPetPaw,
  IconLaptop,
  IconMoreGrid,
} from '../../components/CategoryIcons';

interface SearchScreenProps {
  initialQuery?: string;
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  onOpenLocationModal?: () => void;
  onSelectCategory?: (cat: any) => void;
  onViewAllCategories?: () => void;
  onClose?: () => void;
}

const EXPLORE_8_CATEGORIES = [
  { id: 'beauty', name: 'Beauty & Salon', icon: IconBeautyFace },
  { id: 'hair', name: 'Hair Care', icon: IconScissors },
  { id: 'cleaning', name: 'Home Cleaning', icon: IconHomeCleaning },
  { id: 'repair', name: 'Home Repair', icon: IconHomeRepair },
  { id: 'wellness', name: 'Wellness & Spa', icon: IconWellnessLotus },
  { id: 'appliance', name: 'Appliance Repair', icon: IconWashingMachine },
  { id: 'plumbing', name: 'Plumbing', icon: IconPlumbingTap },
  { id: 'more', name: 'More', icon: IconMoreGrid },
];

const pickCategoryIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('hair') || n.includes('barber')) return IconScissors;
  if (n.includes('beauty') || n.includes('facial') || n.includes('groom') || n.includes('salon')) return IconBeautyFace;
  if (n.includes('clean')) return IconHomeCleaning;
  if (n.includes('plumb')) return IconPlumbingTap;
  if (n.includes('appliance') || n.includes('wash')) return IconWashingMachine;
  if (n.includes('well') || n.includes('spa') || n.includes('health')) return IconWellnessLotus;
  if (n.includes('car') || n.includes('auto') || n.includes('detailing')) return IconCarCare;
  if (n.includes('ac') || n.includes('air')) return IconAirConditioner;
  if (n.includes('repair')) return IconHomeRepair;
  if (n.includes('pet')) return IconPetPaw;
  if (n.includes('it') || n.includes('tech') || n.includes('electronic') || n.includes('laptop')) return IconLaptop;
  return IconMoreGrid;
};

const RECENT_KEY = 'qa_recent_searches';

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  selectedCity = 'Hyderabad',
  onChangeCity,
  onOpenLocationModal,
  onSelectCategory,
  onViewAllCategories,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(selectedCity);
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(EXPLORE_8_CATEGORIES);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Home Cleaning', 'Beauty & Salon', 'Plumbing'];
  });
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [detailService, setDetailService] = useState<any>(null);

  const trendingTags = ['Facial', 'Hair Spa', 'AC Repair', 'Deep Cleaning'];

  useEffect(() => {
    setCity(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    let active = true;
    const fetchCities = () => {
      mobileApi.getActiveCities()
        .then((res) => {
          if (active && Array.isArray(res.data) && res.data.length > 0) {
            setCities(res.data);
          }
        })
        .catch(() => {});
    };

    const fetchCategories = () => {
      mobileApi.getCategories()
        .then((res) => {
          if (!active || !Array.isArray(res?.data) || res.data.length === 0) return;
          const mapped = res.data.slice(0, 7).map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: pickCategoryIcon(c.name),
            dbData: c,
          }));
          mapped.push({ id: 'more', name: 'More', icon: IconMoreGrid });
          setCategories(mapped);
        })
        .catch(() => {});
    };

    fetchCities();
    fetchCategories();

    const channel = supabase
      .channel('search-screen-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, fetchCities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();

    const unsub = mobileApi.subscribeToSync((ev) => {
      if (ev === 'cities_updated') fetchCities();
      if (ev === 'catalog_updated') fetchCategories();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      unsub();
    };
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

  const removeRecent = (term: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_KEY);
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
          mobileApi.getProviders(city, query.trim()).catch(() => ({ data: [] })),
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
  }, [query, city]);

  return (
    <div className="pb-24 min-h-full bg-[#FDFCF4] text-[#111111] flex flex-col">
      {/* 1. Top Bar with Logo & Location Pill (Matching Reference Image 3) */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <QuickAppointmentsLogo />

        {/* Location Dropdown Pill */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#111111] shadow-2xs hover:border-[#16A34A] transition-colors">
          {onOpenLocationModal ? (
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 cursor-pointer"
              title="Check postal pincode or change location"
            >
              <MapPin className="w-3.5 h-3.5 text-[#16A34A] fill-[#16A34A]/20" />
              <span className="truncate max-w-[100px]">{city}</span>
              <ChevronDown className="w-3 h-3 text-[#6B7280]" />
            </button>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-[#16A34A] fill-[#16A34A]/20" />
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  onChangeCity?.(e.target.value);
                }}
                className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer text-[#111111] pr-4 appearance-none"
              >
                {cities.length > 0 ? (
                  cities.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Warangal">Warangal</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-[#6B7280] pointer-events-none absolute right-2.5" />
            </>
          )}
        </div>
      </div>

      {/* 2. Header: Title "Search", Subtitle, Input Box (Matching Reference Image 3) */}
      <div className="px-5 pt-2 pb-3 space-y-3">
        <div>
          <h1 className="text-2xl font-black font-display text-[#111111] tracking-tight">
            Search
          </h1>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            Find services, providers and more
          </p>
        </div>

        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') persistSearch(query);
            }}
            placeholder="Search for services, providers, categories..."
            className="w-full pl-10 pr-10 py-3 text-xs font-medium rounded-full bg-white border border-[#E8E4D9] text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-xs transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 text-[#9CA3AF] hover:text-[#111111] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area: Discovery state vs Search results */}
      {!query.trim() ? (
        <div className="px-5 space-y-5 flex-1">
          {/* 3. Recent Searches (Matching Reference Image 3 with green borders) */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#111111] tracking-tight">
                  Recent Searches
                </h3>
                <button
                  onClick={clearRecent}
                  className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      persistSearch(term);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAFDF7] border border-[#72C838] text-xs font-semibold text-[#1B3808] hover:bg-[#EFF8E7] shadow-2xs transition-all cursor-pointer group"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>{term}</span>
                    <span
                      onClick={(e) => removeRecent(term, e)}
                      className="ml-1 text-[#4B5563] hover:text-[#DC2626] cursor-pointer text-xs leading-none"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Trending Searches (Matching Reference Image 3) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#111111] tracking-tight">
              Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    persistSearch(tag);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-semibold text-[#111111] hover:border-[#16A34A] hover:bg-[#EFF8E7]/40 shadow-2xs transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Explore by Category 4x2 Grid (Matching Reference Image 3) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111111] tracking-tight">
                Explore by Category
              </h3>
              <button
                onClick={onViewAllCategories}
                className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.id === 'more') {
                        onViewAllCategories?.();
                      } else {
                        onSelectCategory?.(cat.dbData || cat);
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-2xs hover:border-[#16A34A] transition-all flex flex-col items-center justify-center text-center gap-1.5 min-h-[92px] cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#EBF9EE] flex items-center justify-center text-[#16A34A] group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" color="#16A34A" />
                    </div>
                    <span className="text-[11px] font-bold text-[#111111] leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Live Search Results View (Clean, No Ratings) */
        <div className="px-5 space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              Searching for "{query}"...
            </div>
          ) : services.length === 0 && providers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4D9] space-y-2">
              <p className="text-xs font-bold text-[#111111]">No matching services or specialists found</p>
              <p className="text-[11px] text-[#6B7280]">
                Try searching for another keyword or select a category above.
              </p>
            </div>
          ) : (
            <>
              {/* Matching Services */}
              {services.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Services ({services.length})
                  </h3>
                  <div className="space-y-2">
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        onClick={() => setDetailService(svc)}
                        className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-2xs flex items-center justify-between gap-3 hover:border-[#16A34A] transition-all cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#111111] truncate group-hover:text-[#16A34A] transition-colors">{svc.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-[#6B7280] mt-0.5">
                            <Clock className="w-3 h-3 text-[#6B7280]" />
                            <span>{svc.durationMinutes ? `${svc.durationMinutes} mins` : (svc.duration || '45 mins')}</span>
                            <span>•</span>
                            <span className="font-bold text-[#16A34A]">₹{svc.basePrice || svc.price}</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            persistSearch(svc.name);
                            setSelectedService(svc);
                          }}
                          className="px-4 py-1.5 rounded-full border border-[#16A34A] text-[#16A34A] text-xs font-bold hover:bg-[#16A34A] hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Specialists / Providers */}
              {providers.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Specialists ({providers.length})
                  </h3>
                  <div className="space-y-2">
                    {providers.map((prov) => (
                      <div
                        key={prov.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#EFF8E7] text-[#16A34A] font-bold text-xs flex items-center justify-center border border-[#65B32E]/30 shrink-0">
                            {(prov.businessName || prov.name || 'P').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#111111] truncate">
                              {prov.businessName || prov.name}
                            </h4>
                            <p className="text-[11px] text-[#6B7280] truncate">
                              {prov.categoryName || 'Verified Specialist'} • {city}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            persistSearch(prov.businessName || prov.name);
                            setSelectedProvider(prov);
                            setSelectedService({
                              id: `${prov.id}_consultation`,
                              name: `${prov.businessName || prov.name} Consultation`,
                              basePrice: 499,
                              durationMinutes: 45,
                            });
                          }}
                          className="px-4 py-1.5 rounded-full border border-[#16A34A] text-[#16A34A] text-xs font-bold hover:bg-[#16A34A] hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={!!detailService}
        service={detailService}
        onClose={() => setDetailService(null)}
        onBookNow={(srv) => {
          setDetailService(null);
          setSelectedService(srv);
        }}
      />

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
            onClose?.();
          }}
        />
      )}
    </div>
  );
};
