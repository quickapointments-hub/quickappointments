import React, { useState, useEffect, useMemo } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
import {
  ArrowLeft,
  Search,
  Heart,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { BookingModal } from '../../components/BookingModal';
import { ServiceDetailsModal } from '../../components/ServiceDetailsModal';
import {
  IconBeautyFace,
  IconScissors,
  IconHomeCleaning,
  IconHomeRepair,
  IconWellnessLotus,
  IconWashingMachine,
  IconPlumbingTap,
  IconAirConditioner,
  IconMakeupBrushes,
  IconNailPolish,
  IconEyeCare,
  IconFacialSpa,
  IconMensGrooming,
} from '../../components/CategoryIcons';

interface CategoryProvidersScreenProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    imageUrl?: string;
    image_url?: string;
  };
  city?: string;
  onBack: () => void;
  onOpenSearch?: () => void;
  onOpenLocationModal?: () => void;
}

interface SubcategoryItem {
  id: string;
  name: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string; color?: string; size?: number | string }>;
}

const CATEGORY_SUBCATEGORIES_MAP: Record<string, SubcategoryItem[]> = {
  beauty: [
    { id: 'sub_hair', name: 'Hair Care', keywords: ['hair', 'haircut', 'keratin', 'color', 'styling', 'blowdry'], icon: IconScissors },
    { id: 'sub_skin', name: 'Skin Care', keywords: ['skin', 'facial', 'clean up', 'glow', 'cleanup', 'peel', 'detox'], icon: IconBeautyFace },
    { id: 'sub_makeup', name: 'Makeup', keywords: ['makeup', 'bridal', 'party', 'contour', 'hd makeup'], icon: IconMakeupBrushes },
    { id: 'sub_nail', name: 'Nail Care', keywords: ['nail', 'manicure', 'pedicure', 'nail art', 'extensions', 'mani', 'pedi'], icon: IconNailPolish },
    { id: 'sub_eye', name: 'Eye Care', keywords: ['eye', 'lashes', 'eyebrow', 'threading', 'microblading', 'lash'], icon: IconEyeCare },
    { id: 'sub_facial', name: 'Facial & Spa', keywords: ['facial', 'spa', 'massage', 'therapy', 'hydra'], icon: IconFacialSpa },
    { id: 'sub_men', name: "Men's Grooming", keywords: ['men', 'beard', 'shave', 'grooming', 'trim'], icon: IconMensGrooming },
    { id: 'sub_pkg', name: 'Salon Packages', keywords: ['package', 'combo', 'bridal package', 'complete', 'salon'], icon: IconWellnessLotus },
  ],
  hair: [
    { id: 'sub_haircut', name: 'Hair Cut', keywords: ['haircut', 'cut', 'trim'], icon: IconScissors },
    { id: 'sub_color', name: 'Hair Color', keywords: ['color', 'highlights', 'root touchup'], icon: IconBeautyFace },
    { id: 'sub_spa', name: 'Hair Spa', keywords: ['spa', 'scalp', 'dandruff'], icon: IconWellnessLotus },
    { id: 'sub_keratin', name: 'Keratin Care', keywords: ['keratin', 'smoothening', 'straightening'], icon: IconBeautyFace },
    { id: 'sub_beard', name: 'Beard Trim', keywords: ['beard', 'mustache', 'shave'], icon: IconMensGrooming },
    { id: 'sub_styling', name: 'Hair Styling', keywords: ['styling', 'blowdry', 'curls'], icon: IconScissors },
    { id: 'sub_scalp', name: 'Scalp Detox', keywords: ['scalp', 'detox', 'treatment'], icon: IconFacialSpa },
    { id: 'sub_bridal_hair', name: 'Bridal Hair', keywords: ['bridal', 'wedding', 'updo'], icon: IconMakeupBrushes },
  ],
  cleaning: [
    { id: 'sub_deep_clean', name: 'Deep Cleaning', keywords: ['deep', 'full house', 'complete'], icon: IconHomeCleaning },
    { id: 'sub_kitchen', name: 'Kitchen Clean', keywords: ['kitchen', 'chimney', 'degrease'], icon: IconHomeCleaning },
    { id: 'sub_bath', name: 'Bathroom Clean', keywords: ['bathroom', 'washroom', 'toilet'], icon: IconPlumbingTap },
    { id: 'sub_sofa', name: 'Sofa & Carpet', keywords: ['sofa', 'carpet', 'cushion', 'mattress'], icon: IconHomeRepair },
    { id: 'sub_balcony', name: 'Balcony & Glass', keywords: ['balcony', 'glass', 'window'], icon: IconAirConditioner },
    { id: 'sub_pest', name: 'Pest Control', keywords: ['pest', 'termite', 'cockroach'], icon: IconHomeCleaning },
    { id: 'sub_tank', name: 'Water Tank', keywords: ['tank', 'water tank', 'overhead'], icon: IconPlumbingTap },
    { id: 'sub_movein', name: 'Move-in Deep', keywords: ['move-in', 'post-construction', 'empty'], icon: IconHomeCleaning },
  ],
  plumbing: [
    { id: 'sub_tap', name: 'Tap & Shower', keywords: ['tap', 'shower', 'faucet'], icon: IconPlumbingTap },
    { id: 'sub_leak', name: 'Pipe Leakage', keywords: ['pipe', 'leak', 'drainage'], icon: IconHomeRepair },
    { id: 'sub_block', name: 'Blockage Fix', keywords: ['block', 'clog', 'sink block'], icon: IconPlumbingTap },
    { id: 'sub_basin', name: 'Sink & Basin', keywords: ['sink', 'basin', 'wash basin'], icon: IconPlumbingTap },
    { id: 'sub_toilet', name: 'Toilet Repair', keywords: ['toilet', 'commode', 'flush'], icon: IconHomeRepair },
    { id: 'sub_motor', name: 'Water Motor', keywords: ['motor', 'pump', 'water pump'], icon: IconWashingMachine },
    { id: 'sub_geyser', name: 'Geyser Install', keywords: ['geyser', 'heater', 'water heater'], icon: IconAirConditioner },
    { id: 'sub_fitting', name: 'Bath Fitting', keywords: ['fitting', 'installation', 'accessories'], icon: IconPlumbingTap },
  ],
};

const DEFAULT_POPULAR_SERVICES: Record<
  string,
  Array<{
    id: string;
    name: string;
    subcategoryId?: string;
    duration: string;
    price: number;
    imageUrl: string;
    providerName: string;
    providerId: string;
    description?: string;
  }>
> = {
  beauty: [
    {
      id: 'bps_facial',
      name: 'Facial Clean Up',
      subcategoryId: 'sub_skin',
      duration: '45 mins',
      price: 499,
      imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
      providerName: 'Glow Beauty Salon',
      providerId: 'fp1',
      description: 'Revitalizing deep facial cleansing with herbal steam, organic exfoliation, pore extraction, and nourishing hydration mask for radiant skin.',
    },
    {
      id: 'bps_haircut',
      name: 'Hair Cut',
      subcategoryId: 'sub_hair',
      duration: '30 mins',
      price: 299,
      imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
      providerName: 'Glow Beauty Salon',
      providerId: 'fp1',
      description: 'Expert haircut tailored to your face structure by senior certified stylist, including hair analysis, precision cutting, and quick blowdry setting.',
    },
    {
      id: 'bps_mani_pedi',
      name: 'Manicure & Pedicure',
      subcategoryId: 'sub_nail',
      duration: '60 mins',
      price: 799,
      imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
      providerName: 'Glow Beauty Salon',
      providerId: 'fp1',
      description: 'Deluxe hand & foot spa therapy with aromatic soak, cuticle contouring, callus buffing, relaxing massage, and salon polish application.',
    },
  ],
};

export const CategoryProvidersScreen: React.FC<CategoryProvidersScreenProps> = ({
  category,
  city = 'Hyderabad',
  onBack,
  onOpenSearch,
  onOpenLocationModal,
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);

  // Detail Modal States
  const [detailService, setDetailService] = useState<any>(null);

  // Booking Modal States
  const [bookingService, setBookingService] = useState<any>(null);
  const [bookingProvider, setBookingProvider] = useState<any>(null);

  // Normalize category key
  const catKey = (category.id || category.name || '').toLowerCase().includes('hair')
    ? 'hair'
    : (category.id || category.name || '').toLowerCase().includes('clean')
    ? 'cleaning'
    : (category.id || category.name || '').toLowerCase().includes('plumb')
    ? 'plumbing'
    : 'beauty';

  const subcategories = useMemo(() => {
    if (CATEGORY_SUBCATEGORIES_MAP[catKey]) {
      return CATEGORY_SUBCATEGORIES_MAP[catKey];
    }
    if (dbServices.length > 0) {
      return dbServices.slice(0, 8).map((s) => ({
        id: s.id,
        name: s.name,
        keywords: [s.name.toLowerCase()],
        icon: IconWellnessLotus,
      }));
    }
    return CATEGORY_SUBCATEGORIES_MAP['beauty'];
  }, [catKey, dbServices]);

  const popularServicesData = DEFAULT_POPULAR_SERVICES[catKey] || DEFAULT_POPULAR_SERVICES['beauty'];

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      const [provRes, servRes, favRes] = await Promise.all([
        mobileApi.getProviders(city, undefined, category.id).catch(() => ({ data: [] })),
        mobileApi.getServices(category.id).catch(() => ({ data: [] })),
        mobileApi.getCustomerFavorites().catch(() => ({ data: [] })),
      ]);

      const fetchedServices = servRes.data || [];
      setDbServices(fetchedServices);

      const allProviders = provRes.data || [];
      const relevant = allProviders.filter((p: any) => {
        if (p.category?.id === category.id || p.categoryId === category.id || p.category_id === category.id) return true;
        if (Array.isArray(p.services) && p.services.some((s: any) => (s.categoryId || s.category_id) === category.id)) return true;
        return fetchedServices.some((s: any) => s.providerId === p.id);
      });

      setProviders(relevant.length > 0 ? relevant : allProviders);

      // Check if primary provider is in customer's favorites
      const primaryProvId = relevant[0]?.id || 'fp1';
      const favList = favRes.data || [];
      setIsFavorite(favList.some((f: any) => f.providerId === primaryProvId || f.id === primaryProvId));
    } catch (err) {
      console.error('Failed to load category details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryData();

    // Realtime Supabase synchronization for live admin panel updates
    const syncSub = mobileApi.subscribeToSync(() => {
      loadCategoryData();
    });

    const channel = supabase
      .channel(`cat-live-${category.id || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, loadCategoryData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, loadCategoryData)
      .subscribe();

    return () => {
      syncSub?.();
      supabase.removeChannel(channel);
    };
  }, [category.id, city]);

  // Merge Database Services with fallback defaults to ensure rich data
  const combinedServices = useMemo(() => {
    if (dbServices.length > 0) {
      return dbServices.map((s: any) => ({
        id: s.id,
        name: s.name,
        subcategoryId: s.subcategoryId || s.sub_category_id,
        duration: s.durationMinutes ? `${s.durationMinutes} mins` : (s.duration || '45 mins'),
        price: s.basePrice || s.price || 499,
        basePrice: s.basePrice || s.price || 499,
        imageUrl: s.imageUrl || s.image_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
        providerName: s.provider?.businessName || s.providerName || `${category.name || 'Verified'} Specialist`,
        providerId: s.providerId || s.provider_id || 'fp1',
        description: s.description || 'Specialized service performed by verified professionals using premium sanitized equipment.',
      }));
    }
    return popularServicesData;
  }, [dbServices, popularServicesData]);

  // Intelligent subcategory filtering using IDs and keyword matching
  const filteredPopularServices = useMemo(() => {
    return combinedServices.filter((svc) => {
      if (selectedSubcategory) {
        const activeSub = subcategories.find((s) => s.id === selectedSubcategory);
        const nameLower = (svc.name || '').toLowerCase();
        const descLower = (svc.description || '').toLowerCase();
        const matchesSubId = svc.subcategoryId === selectedSubcategory;
        const matchesKeyword = activeSub?.keywords.some(
          (k) => nameLower.includes(k) || descLower.includes(k)
        );
        if (!matchesSubId && !matchesKeyword) {
          return false;
        }
      }
      if (searchFilter.trim() && !svc.name.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [combinedServices, selectedSubcategory, subcategories, searchFilter]);

  const handleToggleFavorite = async () => {
    const targetProvId = providers[0]?.id || 'fp1';
    try {
      setFavoriteLoading(true);
      const res = await mobileApi.toggleCustomerFavorite(targetProvId);
      setIsFavorite(res.isFavorite);
    } catch {
      setIsFavorite((prev) => !prev);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBookService = (svc: any) => {
    const defaultProviderName = `${category.name || 'Verified'} Specialist`;
    const matchedProvider =
      providers.find((p) => p.id === svc.providerId) ||
      providers[0] || {
        id: svc.providerId || 'fp1',
        name: svc.providerName || defaultProviderName,
        businessName: svc.providerName || defaultProviderName,
        categoryName: category.name,
      };

    setBookingProvider(matchedProvider);
    setBookingService({
      id: svc.id,
      name: svc.name,
      basePrice: svc.price || svc.basePrice,
      price: svc.price || svc.basePrice,
      duration: svc.duration,
      imageUrl: svc.imageUrl,
      description: svc.description,
    });
  };

  const handleOpenDetail = (svc: any) => {
    setDetailService({
      ...svc,
      categoryName: category.name,
    });
  };

  return (
    <div className="pb-24 space-y-4 bg-[#FDFCF4] text-[#111111] min-h-full">
      {/* 1. Header (Matching Reference Image 1) */}
      <div className="sticky top-0 z-30 bg-[#FDFCF4]/95 backdrop-blur-md border-b border-[#E8E4D9] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-[#FAF8F0] transition-colors cursor-pointer shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#111111] tracking-tight leading-tight">
              {category.name || 'Beauty & Salon'}
            </h1>
            <button
              type="button"
              onClick={onOpenLocationModal}
              className="text-[11px] text-[#6B7280] font-medium leading-tight flex items-center gap-1 hover:text-[#16A34A] transition-colors cursor-pointer text-left"
            >
              <span>Explore services in <strong className="text-[#16A34A]">{city}</strong></span>
              {onOpenLocationModal && <span className="underline text-[10px] ml-0.5">Change</span>}
            </button>
          </div>
        </div>

        {/* Right Search & Favorites Heart Icons (Matching Reference Image 1) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else setShowSearchInput((prev) => !prev);
            }}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-[#FAF8F0] transition-colors cursor-pointer shadow-2xs"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-[#111111]" />
          </button>
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            aria-label="Favorite"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite
                  ? 'fill-[#16A34A] text-[#16A34A]'
                  : 'text-[#16A34A] stroke-[2]'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Optional Search Filter Bar */}
      {showSearchInput && (
        <div className="px-5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search in this category..."
              className="w-full bg-white pl-10 pr-4 py-2 rounded-full text-xs font-semibold text-[#111111] placeholder:text-[#9CA3AF] border border-[#E8E4D9] focus:outline-none focus:border-[#16A34A] shadow-xs"
            />
          </div>
        </div>
      )}

      {/* 2. Hero Banner (Matching Reference Image 1) */}
      <div className="px-5">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EBF9EE] via-[#E4F7E7] to-[#DDF5E1] border border-[#CDE9D2] p-4 flex items-center justify-between min-h-[136px] shadow-xs">
          <div className="max-w-[58%] z-10 space-y-1">
            <h2 className="text-lg font-black font-display text-[#111111] tracking-tight leading-snug">
              {category.name || 'Beauty & Salon'}
            </h2>
            <p className="text-xs font-semibold text-[#374151] leading-relaxed">
              {category.description || 'Hair, Skin, Makeup & More at Your Convenience'}
            </p>
          </div>

          <div className="w-[40%] flex justify-end z-10">
            <img
              src={
                category.imageUrl ||
                category.image_url ||
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80'
              }
              alt={category.name || 'Category'}
              className="h-24 w-28 object-cover rounded-xl shadow-md border-2 border-white/90"
            />
          </div>

          {/* Decorative background shape */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#D2EED7]/60 rounded-full blur-sm pointer-events-none" />
        </div>
      </div>

      {/* 3. Subcategories 4x2 Grid (Matching Reference Image 1) */}
      <div className="px-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111111] tracking-tight">Subcategories</h3>
          {selectedSubcategory && (
            <button
              onClick={() => setSelectedSubcategory(null)}
              className="text-[11px] font-bold text-[#16A34A] hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {subcategories.map((sub) => {
            const Icon = sub.icon;
            const isSelected = selectedSubcategory === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() =>
                  setSelectedSubcategory((prev) => (prev === sub.id ? null : sub.id))
                }
                className={`p-2.5 rounded-2xl bg-white border flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer shadow-2xs min-h-[86px] ${
                  isSelected
                    ? 'border-[#16A34A] bg-[#EFF8E7] ring-2 ring-[#16A34A]/20'
                    : 'border-[#E8E4D9] hover:border-[#16A34A]'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#16A34A] text-white' : 'bg-[#EBF9EE] text-[#16A34A]'
                  }`}
                >
                  <Icon className="w-5 h-5" color={isSelected ? '#FFFFFF' : '#16A34A'} />
                </div>
                <span className="text-[10.5px] font-bold text-[#111111] leading-tight line-clamp-2">
                  {sub.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Popular Services (Matching Reference Image 1) */}
      <div className="px-5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111111] tracking-tight">Popular Services</h3>
          <button
            onClick={() => setShowAllServicesModal(true)}
            className="text-xs font-bold text-[#16A34A] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {filteredPopularServices.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-[#E8E4D9] text-xs text-[#6B7280]">
            No services found for the selected subcategory.
            <button
              onClick={() => setSelectedSubcategory(null)}
              className="block mx-auto mt-2 text-[#16A34A] font-bold hover:underline cursor-pointer"
            >
              Show all services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredPopularServices.slice(0, 3).map((svc) => (
              <div
                key={svc.id}
                onClick={() => handleOpenDetail(svc)}
                className="rounded-2xl bg-white border border-[#E8E4D9] overflow-hidden shadow-2xs flex flex-col justify-between hover:border-[#16A34A] transition-all cursor-pointer group"
              >
                <div>
                  <img
                    src={svc.imageUrl}
                    alt={svc.name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-2.5 space-y-1">
                    <h4 className="text-xs font-bold text-[#111111] leading-tight line-clamp-1 group-hover:text-[#16A34A] transition-colors">
                      {svc.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10.5px] text-[#6B7280]">
                      <Clock className="w-3 h-3 text-[#6B7280]" />
                      <span>{svc.duration}</span>
                    </div>
                    <div className="text-xs font-bold text-[#16A34A] pt-0.5">
                      ₹{svc.price}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookService(svc);
                    }}
                    className="w-full py-1.5 rounded-full border border-[#16A34A] text-[#16A34A] text-xs font-bold hover:bg-[#16A34A] hover:text-white transition-all cursor-pointer text-center"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW ALL SERVICES MODAL */}
      {showAllServicesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-[#FDFCF4] w-full max-w-lg rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
            <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#111111]">All {category.name || 'Beauty & Salon'} Services</h3>
                <p className="text-xs text-[#6B7280]">{combinedServices.length} services available in {city}</p>
              </div>
              <button
                onClick={() => setShowAllServicesModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-xs font-bold text-[#6B7280] hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {combinedServices.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => {
                      setShowAllServicesModal(false);
                      handleOpenDetail(svc);
                    }}
                    className="rounded-2xl bg-white border border-[#E8E4D9] overflow-hidden shadow-2xs flex flex-col justify-between hover:border-[#16A34A] transition-all cursor-pointer"
                  >
                    <img src={svc.imageUrl} alt={svc.name} className="w-full h-24 object-cover" />
                    <div className="p-2.5 space-y-1">
                      <h4 className="text-xs font-bold text-[#111111] line-clamp-1">{svc.name}</h4>
                      <div className="flex items-center gap-1 text-[10.5px] text-[#6B7280]">
                        <Clock className="w-3 h-3 text-[#6B7280]" />
                        <span>{svc.duration}</span>
                      </div>
                      <div className="text-xs font-bold text-[#16A34A] pt-0.5">₹{svc.price}</div>
                    </div>
                    <div className="p-2.5 pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllServicesModal(false);
                          handleBookService(svc);
                        }}
                        className="w-full py-1.5 rounded-full border border-[#16A34A] text-[#16A34A] text-xs font-bold hover:bg-[#16A34A] hover:text-white transition-all cursor-pointer text-center"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={!!detailService}
        service={detailService}
        onClose={() => setDetailService(null)}
        onBookNow={(srv) => {
          setDetailService(null);
          handleBookService(srv);
        }}
      />

      {/* Interactive Booking Modal */}
      {bookingService && (
        <BookingModal
          service={bookingService}
          provider={bookingProvider}
          onClose={() => {
            setBookingService(null);
            setBookingProvider(null);
          }}
          onSuccess={(_booking) => {
            setBookingService(null);
            setBookingProvider(null);
          }}
        />
      )}
    </div>
  );
};
