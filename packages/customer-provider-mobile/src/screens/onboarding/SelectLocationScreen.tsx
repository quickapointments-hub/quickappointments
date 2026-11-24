import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, Check, Crosshair, Info } from 'lucide-react';
import { LeavesDecoration } from '../../components/LeavesDecoration';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';

interface SelectLocationScreenProps {
  onContinue: (city: string) => void;
  onBack?: () => void;
}

export const SelectLocationScreen: React.FC<SelectLocationScreenProps> = ({
  onContinue,
  onBack,
}) => {
  const [serviceCities, setServiceCities] = useState<any[]>([
    { id: '1', name: 'Bengaluru', state: 'Karnataka' },
    { id: '2', name: 'Delhi', state: 'Delhi NCR' },
    { id: '3', name: 'Hyderabad', state: 'Telangana' },
    { id: '4', name: 'Mumbai', state: 'Maharashtra' },
  ]);
  const [selectedCity, setSelectedCity] = useState<string>('Hyderabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    loadActiveCities();

    // Supabase Realtime synchronization
    const channel = supabase
      .channel('mobile-cities-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
        loadActiveCities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveCities = async () => {
    try {
      const res = await mobileApi.getActiveCities();
      if (res.data && res.data.length > 0) {
        setServiceCities(res.data);
        const saved = localStorage.getItem('qa_selected_city');
        if (saved && res.data.some((c: any) => c.name.toLowerCase() === saved.toLowerCase())) {
          setSelectedCity(saved);
        } else {
          setSelectedCity(res.data[0].name);
        }
      }
    } catch (err) {
      console.warn('Using default city list:', err);
    }
  };

  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName);
    try {
      localStorage.setItem('qa_selected_city', cityName);
    } catch (e) {}
  };

  const handleUseCurrentLocation = () => {
    setDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (_pos) => {
          const fallback = serviceCities[0]?.name || 'Hyderabad';
          setSelectedCity(fallback);
          try {
            localStorage.setItem('qa_selected_city', fallback);
          } catch (e) {}
          setDetectingLocation(false);
        },
        (_err) => {
          const fallback = serviceCities[0]?.name || 'Hyderabad';
          setSelectedCity(fallback);
          try {
            localStorage.setItem('qa_selected_city', fallback);
          } catch (e) {}
          setDetectingLocation(false);
        },
        { timeout: 4000 }
      );
    } else {
      const fallback = serviceCities[0]?.name || 'Hyderabad';
      setSelectedCity(fallback);
      try {
        localStorage.setItem('qa_selected_city', fallback);
      } catch (e) {}
      setDetectingLocation(false);
    }
  };

  const isPincodeSearch = /^\d{5,6}$/.test(searchQuery.trim());
  const [asyncMatchedCity, setAsyncMatchedCity] = useState<any | null>(null);

  const matchedPincodeCity = isPincodeSearch
    ? serviceCities.find((c) => {
        const list = c.pincodeList || (c.pincodes ? c.pincodes.split(',').map((p: string) => p.trim()) : []);
        return list.includes(searchQuery.trim());
      }) || asyncMatchedCity
    : null;

  useEffect(() => {
    const cleanPin = searchQuery.trim();
    if (cleanPin.length === 6 && /^\d{6}$/.test(cleanPin)) {
      mobileApi.validatePincode(cleanPin).then((res) => {
        if (res.serviceable && res.location) {
          const loc = res.location;
          setAsyncMatchedCity({
            id: loc.id || `loc-${loc.pincode}`,
            name: loc.city,
            state: loc.state,
            pincodes: loc.pincode,
            pincodeList: [loc.pincode],
          });
          setSelectedCity(loc.city);
          try {
            localStorage.setItem('qa_selected_city', loc.city);
          } catch (e) {}
        } else {
          setAsyncMatchedCity(null);
        }
      });
    } else {
      setAsyncMatchedCity(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (matchedPincodeCity) {
      setSelectedCity(matchedPincodeCity.name);
      try {
        localStorage.setItem('qa_selected_city', matchedPincodeCity.name);
      } catch (e) {}
    }
  }, [matchedPincodeCity]);

  const filteredCities = serviceCities.filter((city) => {
    if (isPincodeSearch) {
      const list = city.pincodeList || (city.pincodes ? city.pincodes.split(',').map((p: string) => p.trim()) : []);
      return list.some((p: string) => p.includes(searchQuery.trim())) || city.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return (
      city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (city.state && city.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (city.pincodes && city.pincodes.includes(searchQuery.trim()))
    );
  });

  return (
    <div className="relative min-h-full h-full flex flex-col justify-between p-6 bg-[#FFFFFF] text-[#111111] overflow-y-auto select-none">
      {/* Top Header: Back Arrow */}
      <div className="pt-2 flex items-center justify-between relative z-10">
        {onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center text-[#111111] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-2 relative z-10 max-w-sm mx-auto w-full">
        {/* Map & Pin Illustration (Matching Screenshot 1) */}
        <div className="flex justify-center mb-4">
          <div className="relative w-40 h-28 flex items-center justify-center">
            {/* Soft background skyline & trees silhouette */}
            <svg
              viewBox="0 0 200 120"
              className="absolute inset-0 w-full h-full text-[#E5EFE2]"
              fill="currentColor"
            >
              {/* Soft background trees */}
              <circle cx="50" cy="70" r="16" fill="#E8F4E5" />
              <rect x="48" y="70" width="4" height="20" fill="#D3E8CF" />
              <circle cx="150" cy="70" r="16" fill="#E8F4E5" />
              <rect x="148" y="70" width="4" height="20" fill="#D3E8CF" />
              {/* Soft buildings */}
              <rect x="65" y="48" width="14" height="36" rx="2" fill="#EBF3E8" />
              <rect x="85" y="40" width="16" height="44" rx="2" fill="#E5EFE2" />
              <rect x="120" y="46" width="15" height="38" rx="2" fill="#EBF3E8" />
            </svg>

            {/* Folded Map Shape */}
            <svg
              viewBox="0 0 160 80"
              className="relative z-10 w-36 h-20 filter drop-shadow-sm"
              fill="none"
            >
              <polygon points="10,30 55,20 55,70 10,80" fill="#D7ECD4" stroke="#C2E2BC" strokeWidth="1" />
              <polygon points="55,20 105,32 105,82 55,70" fill="#EAF6E7" stroke="#C2E2BC" strokeWidth="1" />
              <polygon points="105,32 150,22 150,72 105,82" fill="#D7ECD4" stroke="#C2E2BC" strokeWidth="1" />
              {/* Map roads/grids */}
              <line x1="20" y1="50" x2="45" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="68" y1="40" x2="95" y2="48" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="115" y1="50" x2="140" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            {/* Radiant Sparkle Accents */}
            <div className="absolute top-2 right-8 flex flex-col gap-1">
              <span className="w-1.5 h-3 bg-[#16A34A] rounded-full rotate-45 transform origin-bottom" />
              <span className="w-1.5 h-2 bg-[#16A34A] rounded-full rotate-12 -mt-1 ml-2 transform origin-bottom" />
            </div>

            {/* Standing Green Map Pin */}
            <div className="absolute z-20 -top-1">
              <div className="relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#16A34A] flex items-center justify-center shadow-lg shadow-[#16A34A]/30">
                  <div className="w-5 h-5 rounded-full bg-white" />
                </div>
                {/* Pin pointer triangle */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-[#16A34A] -mt-0.5" />
                {/* Pin shadow ellipse */}
                <div className="w-6 h-2 bg-black/10 rounded-full blur-[1px] mt-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Select Your Location
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1 font-medium px-2">
            Choose your city to find nearby services and providers
          </p>
        </div>

        {/* Search city or postal pincode input */}
        <div className="mb-3.5 space-y-2">
          <div className="w-full bg-white rounded-2xl border border-[#D1D5DB] focus-within:border-[#16A34A] flex items-center px-4 py-3 shadow-xs transition-colors">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city, state or 6-digit pincode (e.g. 500081)"
              className="w-full text-xs sm:text-sm font-medium text-[#111111] placeholder-[#9CA3AF] focus:outline-none bg-transparent"
            />
          </div>

          {/* Real-time Pincode Validation Feedback */}
          {isPincodeSearch && matchedPincodeCity && (
            <div className="p-3 bg-[#EFF8E7] border border-[#16A34A]/30 rounded-2xl text-xs text-[#16A34A] font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 stroke-[3] shrink-0" />
              <span>
                Pincode {searchQuery.trim()} is serviceable! Location selected as{' '}
                <strong>{matchedPincodeCity.name}</strong>.
              </span>
            </div>
          )}

          {isPincodeSearch && !matchedPincodeCity && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-semibold space-y-1 animate-fadeIn">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pincode {searchQuery.trim()} is not currently serviceable</span>
              </p>
              <p className="text-[11px] text-amber-700">
                Admin has enabled services in:{' '}
                {serviceCities.map((c) => c.name).join(', ') || 'Warangal, Hyderabad'}. Please select one of these locations below.
              </p>
            </div>
          )}
        </div>


        {/* Popular Cities section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm sm:text-base font-black text-[#111111]">
              Popular Cities
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#EFF8E7] px-2.5 py-0.5 rounded-full border border-[#16A34A]/20">
              <Info className="w-3 h-3 text-[#16A34A]" />
              <span>Admin Managed Cities</span>
            </div>
          </div>

          {/* 2x2 Grid of Cities */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredCities.map((city) => {
              const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.id || city.name}
                  onClick={() => handleCityClick(city.name)}
                  type="button"
                  className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#16A34A] border-2 bg-white shadow-xs'
                      : 'border-[#E5E7EB] bg-white hover:bg-[#FFFFFF]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-sm font-bold block truncate ${
                        isSelected ? 'text-[#16A34A]' : 'text-[#111111]'
                      }`}
                    >
                      {city.name}
                    </span>
                    {city.state && (
                      <span className="text-[10px] sm:text-xs text-[#6B7280] block truncate mt-0.5 font-medium">
                        {city.state}
                      </span>
                    )}
                    {city.pincodes && (
                      <span className="text-[9px] text-[#16A34A] block truncate mt-0.5 font-mono font-semibold">
                        {city.pincodes.slice(0, 26)}...
                      </span>
                    )}
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-[#16A34A] flex items-center justify-center text-white shrink-0 ml-2">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#D1D5DB] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {filteredCities.length === 0 && (
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] text-center text-xs text-[#6B7280]">
              No active cities found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="relative z-10 pt-2 pb-2 max-w-sm mx-auto w-full">
        <button
          onClick={() => onContinue(selectedCity)}
          type="button"
          disabled={!selectedCity}
          className="w-full py-4 px-6 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm sm:text-base shadow-md shadow-[#16A34A]/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Soft Organic Curves */}
      <LeavesDecoration />
    </div>
  );
};
