import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users2, Search, MapPin, Star, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const ProvidersPage: React.FC<{ onNavigateToKyc: () => void }> = ({ onNavigateToKyc }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await api.getProviders();
      setProviders(res.data || []);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = providers.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.businessName?.toLowerCase().includes(q) ||
      p.user?.fullName?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.user?.phone?.includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-5 h-5 text-brand-600" />
            <span>Service Provider Directory & Verification</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Overview of all registered individual and business service providers.
          </p>
        </div>
        <button
          onClick={onNavigateToKyc}
          className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
        >
          Open KYC Verification Desk
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search provider by name, business, city or phone..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
        />
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-bold flex items-center justify-center text-sm">
                  {(p.businessName || p.user?.fullName || 'P').charAt(0)}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.verificationStatus === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.verificationStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {p.verificationStatus}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">
                {p.businessName || p.user?.fullName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{p.user?.fullName} • {p.user?.phone}</p>
              
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {p.ratingAvg}
                </span>
                <span className="text-slate-400">|</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {p.city}
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500">{p.experienceYears}y exp</span>
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {p.address}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {p._count?.bookings || 0} lifetime bookings
              </span>
              <span className={`font-semibold ${p.isAcceptingBookings ? 'text-brand-600' : 'text-slate-400'}`}>
                {p.isAcceptingBookings ? 'Accepting Slots' : 'Paused'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

