import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Users,
  Search,
  MoreVertical,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react';

import { exportToCsv } from '../../utils/exportCsv';

export const ProvidersPage: React.FC<{
  onNavigateToKyc?: () => void;
  onViewDetails?: (providerId: string) => void;
}> = ({ onNavigateToKyc, onViewDetails }) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'INDIVIDUAL' | 'BUSINESS'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();

    // Supabase Real-time updates
    const channel = supabase
      .channel('providers-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        loadProviders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await api.getProviders();
      setProviders(res.data || []);
    } catch (err) {
      console.warn('Failed to load providers from database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic KPI Counts from Real Database Records
  const totalCount = providers.length;
  const approvedCount = providers.filter(
    (p) => (p.verification_status || p.verificationStatus) === 'APPROVED'
  ).length;
  const pendingCount = providers.filter(
    (p) => (p.verification_status || p.verificationStatus) === 'PENDING'
  ).length;
  const underReviewCount = providers.filter(
    (p) => (p.verification_status || p.verificationStatus) === 'NEEDS_INFO' || (p.verification_status || p.verificationStatus) === 'UNDER_REVIEW'
  ).length;
  const rejectedCount = providers.filter(
    (p) => (p.verification_status || p.verificationStatus) === 'REJECTED'
  ).length;

  const filtered = providers.filter((p) => {
    const pType = (p.provider_type || p.providerType || 'INDIVIDUAL').toUpperCase();
    if (activeTab !== 'ALL' && pType !== activeTab) return false;

    const pStatus = (p.verification_status || p.verificationStatus || 'PENDING').toUpperCase();
    if (statusFilter !== 'ALL' && pStatus !== statusFilter) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const bName = (p.business_name || p.businessName || '').toLowerCase();
    const uName = (p.user?.full_name || p.user?.fullName || '').toLowerCase();
    const city = (p.city || '').toLowerCase();
    const phone = (p.user?.phone || '').toLowerCase();

    return bName.includes(q) || uName.includes(q) || city.includes(q) || phone.includes(q);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Service Provider Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage, verify, and monitor individual and business service providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const csv =
                'Business Name,Owner,City,Type,Status,Created At\n' +
                providers
                  .map(
                    (p) =>
                      `"${p.business_name || p.businessName}","${p.user?.full_name || ''}","${p.city}","${p.provider_type}","${p.verification_status}","${p.created_at}"`
                  )
                  .join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'providers_directory.csv';
              a.click();
            }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {onNavigateToKyc && (
            <button
              onClick={onNavigateToKyc}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KYC Review ({pendingCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 KPI Cards (Dynamically computed from real database rows) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Total Providers</span>
          <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
            {totalCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">In database</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Approved</span>
          <span className="text-xl font-black text-[#16A34A] block mt-1 font-mono">
            {approvedCount}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-0.5 block font-semibold">Active in app</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Pending KYC</span>
          <span className="text-xl font-black text-amber-600 block mt-1 font-mono">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-600 mt-0.5 block font-semibold">Needs review</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Needs Re-upload</span>
          <span className="text-xl font-black text-blue-600 block mt-1 font-mono">
            {underReviewCount}
          </span>
          <span className="text-[10px] text-blue-600 mt-0.5 block font-semibold">Waiting on HD docs</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Rejected</span>
          <span className="text-xl font-black text-rose-600 block mt-1 font-mono">
            {rejectedCount}
          </span>
          <span className="text-[10px] text-rose-600 mt-0.5 block font-semibold">Non-compliant</span>
        </div>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] rounded-2xl border border-slate-200/60 max-w-fit">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Providers ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('INDIVIDUAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'INDIVIDUAL'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setActiveTab('BUSINESS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'BUSINESS'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Business
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Review</option>
              <option value="NEEDS_INFO">Needs Re-upload</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full bg-[#FAF9F5] rounded-2xl border border-slate-200 flex items-center px-4 py-2.5 text-xs">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name, owner name, city, or phone..."
            className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
          />
        </div>

        {/* Providers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Provider / Business</th>
                <th className="py-3 px-3">Owner Contact</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">City &amp; Coverage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading live database records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No providers found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const bName = p.business_name || p.businessName || 'Business Partner';
                  const uName = p.user?.full_name || p.user?.fullName || 'Provider Contact';
                  const phone = p.user?.phone || 'No phone';
                  const email = p.user?.email || 'No email';
                  const city = p.city || 'Hyderabad';
                  const status = (p.verification_status || p.verificationStatus || 'PENDING').toUpperCase();
                  const pType = (p.provider_type || p.providerType || 'INDIVIDUAL').toUpperCase();

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0">
                            {bName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{bName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {p.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-bold text-slate-800 block">{uName}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{phone}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                            {email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {pType}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div>
                          <span className="font-semibold text-slate-800 block">{city}</span>
                          <span className="text-[10px] text-slate-400 block">
                            Radius: {p.service_radius_km || 20} km
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {status === 'APPROVED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20">
                            Approved
                          </span>
                        ) : status === 'PENDING' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        ) : status === 'NEEDS_INFO' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Needs Re-upload
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(p.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#EFF8E7] hover:bg-[#E4F4DA] text-[#16A34A] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Open dedicated Provider Details page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          )}
                          {onNavigateToKyc && status !== 'APPROVED' && (
                            <button
                              onClick={onNavigateToKyc}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              title="Inspect KYC documents"
                            >
                              KYC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
