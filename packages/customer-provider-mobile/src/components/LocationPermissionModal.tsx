import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { MapPin } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (city: string) => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onLocationSelected,
}) => {
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [pincodeInput, setPincodeInput] = useState('');
  const [validatingPin, setValidatingPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCities();
      setShowManualPicker(false);
      setPincodeInput('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadCities = async () => {
    try {
      const res = await mobileApi.getActiveCities();
      setCities(res?.data || []);
    } catch { }
  };

  const selectAndSaveCity = (cityName: string) => {
    try {
      localStorage.setItem('qa_selected_city', cityName);
    } catch {}
    onLocationSelected(cityName);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setShowManualPicker(true);
      return;
    }
    setLocating(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (_pos) => {
        setLocating(false);
        const defaultCity = cities[0]?.name || 'Hyderabad';
        selectAndSaveCity(defaultCity);
      },
      (_err) => {
        setLocating(false);
        setShowManualPicker(true);
      },
      { timeout: 5000 }
    );
  };

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincodeInput.trim();
    if (clean.length < 5) {
      setErrorMsg('Please enter a valid postal pincode');
      return;
    }

    try {
      setValidatingPin(true);
      setErrorMsg(null);
      const res = await mobileApi.validatePincode(clean);
      if (res?.serviceable && res?.city?.name) {
        selectAndSaveCity(res.city.name);
      } else {
        setErrorMsg(
          res?.message || `Pincode ${clean} is not serviceable. Please choose from enabled cities below.`
        );
      }
    } catch (err: any) {
      // Check locally against loaded cities
      const match = cities.find((c) => {
        const list = c.pincodeList || (c.pincodes ? c.pincodes.split(',').map((p: string) => p.trim()) : []);
        return list.includes(clean);
      });
      if (match) {
        selectAndSaveCity(match.name);
      } else {
        setErrorMsg(`Pincode ${clean} is not serviceable. Please select an available city.`);
      }
    } finally {
      setValidatingPin(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#FFFFFF] w-full max-w-sm rounded-t-[32px] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9] p-6 text-center space-y-4 max-h-[85vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] text-[#6B7280] hover:text-[#111111] flex items-center justify-center cursor-pointer transition-colors text-xs"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Map Pin Visual */}
        <div className="w-16 h-16 rounded-full bg-[#EFF8E7] text-[#65B32E] flex items-center justify-center mx-auto border-4 border-white shadow-sm shrink-0">
          <MapPin className="w-7 h-7 text-[#65B32E]" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-[#111111]">
            {showManualPicker ? 'Select Serviceable Location' : 'Allow Location Access'}
          </h3>
          <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
            {showManualPicker
              ? 'Enter your postal pincode or choose an Admin-configured serviceable hub.'
              : 'Quick Appointments uses your location to discover nearby verified specialists.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold text-left">
            {errorMsg}
          </div>
        )}

        {!showManualPicker ? (
          <div className="space-y-2 pt-2">
            <button
              disabled={locating}
              onClick={handleUseCurrentLocation}
              className="w-full py-3 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{locating ? 'Detecting GPS...' : 'Use Current Location'}</span>
            </button>
            <button
              onClick={() => setShowManualPicker(true)}
              className="w-full py-2.5 bg-transparent text-xs font-bold text-[#4B5563] hover:text-black cursor-pointer"
            >
              Enter Pincode or Select City
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1 text-left">
            {/* Pincode Input Form */}
            <form onSubmit={handlePincodeSubmit} className="space-y-2">
              <label className="text-[11px] font-bold text-[#111111] block">
                Check Postal Pincode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  placeholder="e.g. 500081 or 506001"
                  className="flex-1 px-3 py-2 bg-white rounded-xl border border-[#E8E4D9] text-xs font-bold text-[#111111] focus:outline-none focus:border-[#65B32E]"
                />
                <button
                  type="submit"
                  disabled={validatingPin}
                  className="px-3 py-2 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {validatingPin ? '...' : 'Check'}
                </button>
              </div>
            </form>

            <div className="pt-2">
              <label className="text-[11px] font-bold text-[#4B5563] block mb-1.5">
                Or Select from Admin Cities:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {cities.map((c) => (
                  <button
                    key={c.id || c.name}
                    type="button"
                    onClick={() => selectAndSaveCity(c.name)}
                    className="p-2.5 rounded-xl bg-white border border-[#E8E4D9] hover:border-[#65B32E] hover:bg-[#EFF8E7] text-left transition-all cursor-pointer"
                  >
                    <span className="font-bold text-xs text-[#111111] block truncate">{c.name}</span>
                    <span className="text-[10px] text-[#6B7280] block truncate">{c.state}</span>
                    {c.pincodes && (
                      <span className="text-[9px] text-[#65B32E] block font-mono truncate mt-0.5 font-semibold">
                        {c.pincodes.slice(0, 18)}...
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowManualPicker(false)}
              className="w-full text-center text-xs font-bold text-[#4B5563] hover:text-black pt-1 cursor-pointer"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
