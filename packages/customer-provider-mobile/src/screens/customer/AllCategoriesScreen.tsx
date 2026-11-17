import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
import { QuickAppointmentsLogo } from '../../components/QuickAppointmentsLogo';
import { ArrowLeft, Search, MapPin, ChevronDown } from 'lucide-react';
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

interface AllCategoriesScreenProps {
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  onOpenLocationModal?: () => void;
  onSelectCategory: (cat: any) => void;
  onBack: () => void;
}

export interface CategoryItem {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  imageUrl?: string;
  dbData?: any;
}

export const ALL_12_STANDARD_CATEGORIES: CategoryItem[] = [
  { id: 'beauty', name: 'Beauty & Salon', shortName: 'Beauty & Salon', icon: IconBeautyFace },
  { id: 'hair', name: 'Hair Care', shortName: 'Hair Care', icon: IconScissors },
  { id: 'cleaning', name: 'Home Cleaning', shortName: 'Home Cleaning', icon: IconHomeCleaning },
  { id: 'repair', name: 'Home Repair', shortName: 'Home Repair', icon: IconHomeRepair },
  { id: 'wellness', name: 'Wellness & Spa', shortName: 'Wellness & Spa', icon: IconWellnessLotus },
  { id: 'appliance', name: 'Appliance Repair', shortName: 'Appliance Repair', icon: IconWashingMachine },
  { id: 'plumbing', name: 'Plumbing', shortName: 'Plumbing', icon: IconPlumbingTap },
  { id: 'ac', name: 'AC Repair & Service', shortName: 'AC Repair & Service', icon: IconAirConditioner },
  { id: 'car', name: 'Car Care & Detailing', shortName: 'Car Care & Detailing', icon: IconCarCare },
  { id: 'pet', name: 'Pet Care', shortName: 'Pet Care', icon: IconPetPaw },
  { id: 'it', name: 'IT & Electronics Services', shortName: 'IT & Electronics Services', icon: IconLaptop },
  { id: 'more', name: 'More Services', shortName: 'More Services', icon: IconMoreGrid },
];

export const AllCategoriesScreen: React.FC<AllCategoriesScreenProps> = ({
  selectedCity = 'Hyderabad',
  onChangeCity,
  onOpenLocationModal,
  onSelectCategory,
  onBack,
}) => {
  const [categories, setCategories] = useState<any[]>(ALL_12_STANDARD_CATEGORIES);
  const [cities, setCities] = useState<any[]>([]);
  const [city, setCity] = useState(selectedCity);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCity(selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [catRes, cityRes] = await Promise.all([
          mobileApi.getCategories().catch(() => ({ data: [] })),
          mobileApi.getActiveCities().catch(() => ({ data: [] })),
        ]);
        if (!active) return;
        if (Array.isArray(catRes?.data) && catRes.data.length > 0) {
          const dbCats = catRes.data;
          const merged = ALL_12_STANDARD_CATEGORIES.map((std) => {
            const dbMatch = dbCats.find(
              (c: any) =>
                c.name?.toLowerCase().includes(std.id) ||
                std.name.toLowerCase().includes(c.name?.toLowerCase())
            );
            return dbMatch ? { ...std, id: dbMatch.id, dbData: dbMatch } : std;
          });

          // Also include any newly added custom categories created by Admin in Admin Panel
          dbCats.forEach((dbc: any) => {
            if (!merged.some((m) => m.id === dbc.id || m.name.toLowerCase() === dbc.name?.toLowerCase())) {
              merged.push({
                id: dbc.id,
                name: dbc.name,
                shortName: dbc.name,
                icon: IconMoreGrid,
                imageUrl: dbc.image_url || dbc.imageUrl,
                dbData: dbc,
              });
            }
          });

          setCategories(merged);
        }
        if (Array.isArray(cityRes?.data) && cityRes.data.length > 0) {
          setCities(cityRes.data);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel('all-categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, load)
      .subscribe();

    const unsubSync = mobileApi.subscribeToSync((ev) => {
      if (ev === 'catalog_updated' || ev === 'cities_updated') load();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      unsubSync();
    };
  }, []);

  const filtered = categories.filter((c) =>
    search.trim()
      ? (c?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c?.shortName || '').toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="pb-24 min-h-full bg-[#FDFCF4] text-[#111111]">
      {/* 1. Top Bar with Logo and Location Pill (Matching Reference Image 2) */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <QuickAppointmentsLogo />

        {/* Location Pill */}
        <div className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#111111] shadow-xs">
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
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi">Delhi</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-[#6B7280] pointer-events-none absolute right-2.5" />
            </>
          )}
        </div>
      </div>

      {/* 2. Header: Back Arrow, "All Categories", Subtitle (Matching Reference Image 2) */}
      <div className="px-5 pt-3 pb-3 flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-1 w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-[#FAF8F0] cursor-pointer shrink-0 shadow-xs transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>
        <div>
          <h1 className="text-xl font-black font-display text-[#111111] tracking-tight leading-tight">
            All Categories
          </h1>
          <p className="text-xs text-[#6B7280] font-medium leading-tight mt-0.5">
            Explore all available service categories
          </p>
        </div>
      </div>

      {/* 3. Search Categories Input (Matching Reference Image 2) */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-3 text-xs font-medium rounded-full bg-white border border-[#E8E4D9] text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-xs transition-all"
          />
        </div>
      </div>

      {/* 4. 3x4 Grid of 12 Categories (Matching Reference Image 2) */}
      <div className="px-5">
        {loading && categories.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">Loading categories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4D9] text-xs text-[#6B7280]">
            No categories matching "{search}".
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((cat) => {
              const Icon = cat.icon || IconMoreGrid;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => onSelectCategory(cat)}
                  className="p-3.5 rounded-2xl bg-white border border-[#E8E4D9] shadow-xs hover:border-[#16A34A] transition-all flex flex-col items-center justify-center text-center gap-2.5 min-h-[116px] cursor-pointer group"
                >
                  <div className="w-13 h-13 rounded-full bg-[#EBF9EE] flex items-center justify-center text-[#16A34A] group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" color="#16A34A" />
                  </div>
                  <span className="text-[11.5px] font-bold text-[#111111] leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
