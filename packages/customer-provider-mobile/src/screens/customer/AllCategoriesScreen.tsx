import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import {
  ArrowLeft,
  Search,
  MapPin,
  Sparkles,
  Scissors,
  Home,
  Wrench,
  Flower2,
  Refrigerator,
  Droplets,
  Wind,
  Car,
  PawPrint,
  Laptop,
  LayoutGrid,
} from 'lucide-react';

interface AllCategoriesScreenProps {
  selectedCity?: string;
  onChangeCity?: (city: string) => void;
  onSelectCategory: (cat: any) => void;
  onBack: () => void;
}

const pickCategoryIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('hair')) return Scissors;
  if (n.includes('beauty') || n.includes('salon') || n.includes('skin') || n.includes('facial')) return Sparkles;
  if (n.includes('clean')) return Home;
  if (n.includes('repair') && n.includes('appliance')) return Refrigerator;
  if (n.includes('repair')) return Wrench;
  if (n.includes('wellness') || n.includes('spa') || n.includes('massage')) return Flower2;
  if (n.includes('plumb')) return Droplets;
  if (n.includes('ac') || n.includes('cool')) return Wind;
  if (n.includes('car') || n.includes('auto')) return Car;
  if (n.includes('pet')) return PawPrint;
  if (n.includes('it') || n.includes('tech') || n.includes('electronic')) return Laptop;
  return LayoutGrid;
};

export const AllCategoriesScreen: React.FC<AllCategoriesScreenProps> = ({
  selectedCity = 'Hyderabad',
  onChangeCity,
  onSelectCategory,
  onBack,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [city, setCity] = useState(selectedCity);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
        setCities(Array.isArray(cityRes?.data) ? cityRes.data : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = categories.filter((c) =>
    search.trim()
      ? (c?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c?.description || '').toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="pb-24 min-h-full bg-[#FDFCF4] text-[#111111]">
      {/* Top Bar */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Quick Appointments" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E4D9] text-xs font-bold text-[#111111] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              onChangeCity?.(e.target.value);
            }}
            className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer text-[#111111]"
          >
            {cities.length > 0 ? (
              cities.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value={city}>{city}</option>
            )}
          </select>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-2 pb-3 flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-1 p-1.5 rounded-full bg-white border border-[#E8E4D9] text-[#111111] hover:bg-[#FAF8F0] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black font-display text-[#111111] tracking-tight">
            All Categories
          </h2>
          <p className="text-xs text-[#4B5563] font-medium">
            Explore all available service categories
          </p>
        </div>
      </div>

      {/* Search Categories Input */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-white border border-[#E8E4D9] text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-sm"
          />
        </div>
      </div>

      {/* 3-Column Category Cards */}
      <div className="px-5">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">Loading categories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4D9] text-xs text-[#6B7280]">
            No categories matching "{search}".
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((cat) => {
              const Icon = pickCategoryIcon(cat.name);
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => onSelectCategory(cat)}
                  className="p-3 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm hover:border-[#16A34A] transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[112px] cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#16A34A]">
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#111111] leading-tight line-clamp-2">
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

