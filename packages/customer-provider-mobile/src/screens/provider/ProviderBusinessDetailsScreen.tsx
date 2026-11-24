import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  MapPin,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ProviderBusinessDetailsScreenProps {
  onNext: (businessData: any) => void;
  onBack?: () => void;
}

export const ProviderBusinessDetailsScreen: React.FC<ProviderBusinessDetailsScreenProps> = ({
  onNext,
  onBack,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [businessName, setBusinessName] = useState(user?.providerProfile?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.providerProfile?.businessType || '');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState(user?.providerProfile?.city || 'Mumbai');
  const [address, setAddress] = useState(user?.providerProfile?.address || '');
  const [bio, setBio] = useState(user?.providerProfile?.bio || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mobileApi
      .getCategories()
      .then((res) => {
        setCategories(res.data || []);
        if (res.data?.length > 0) {
          setCategoryId(res.data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !address.trim()) {
      setError('Business name and physical address are required');
      return;
    }

    onNext({
      businessName,
      businessType,
      categoryId,
      city,
      address,
      bio,
    });
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Step 1 of 3</span>
          <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
            Business Details
          </h2>
        </div>
      </div>

      {/* Intro Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <p className="font-bold">Register as Verified Service Provider</p>
          <p className="text-[11px] text-amber-800/80 mt-0.5">
            Join thousands of professionals earning on Quick Appointments with instant automated T+1 payouts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Business / Professional Name *
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="e.g. Apex Health & Dental Clinic"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Business Entity *
            </label>
            <input
              type="text"
              placeholder="e.g. Individual, Sole Proprietorship, LLP, Pvt Ltd"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Primary City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-xs"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Primary Service Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-xs"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Physical Operating Address *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Shop / Unit number, Street, Landmark"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Professional Bio & Experience Summary
          </label>
          <textarea
            rows={3}
            placeholder="Describe your services, years of experience, and specialty..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 outline-none focus:border-brand-500 shadow-xs resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Continue to KYC Verification</span>
          <ArrowRight className="w-4 h-4 text-brand-400" />
        </button>
      </form>
    </div>
  );
};

