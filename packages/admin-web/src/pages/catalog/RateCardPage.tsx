import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  IndianRupee,
  Layers,
  X,
  MessageSquare,
} from 'lucide-react';

export const RateCardPage: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRates();

    const channel = supabase
      .channel('admin-rate-cards-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_service_rates' }, () => {
        loadRates();
      })
      .subscribe();

    const unsub = api.subscribeToSync((ev) => {
      if (ev === 'rates_updated' || ev === 'catalog_updated') loadRates();
    });

    return () => {
      supabase.removeChannel(channel);
      unsub();
    };
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingRates();
      setRates(res.data || []);
    } catch (err) {
      console.error('Error loading rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (rateId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    try {
      setActionLoading(true);
      await api.decideRateCard(rateId, action, reason);
      setSuccessMsg(`Service rate request successfully ${action === 'APPROVE' ? 'approved' : 'rejected'}!`);
      setRejectModalItem(null);
      setRejectReason('');
      await loadRates();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = rates.filter((r) => (r.approvalStatus || r.approval_status) === 'PENDING').length;
  const approvedCount = rates.filter((r) => (r.approvalStatus || r.approval_status) === 'APPROVED').length;
  const rejectedCount = rates.filter((r) => (r.approvalStatus || r.approval_status) === 'REJECTED').length;

  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      const st = r.approvalStatus || r.approval_status || 'PENDING';
      if (statusTab !== 'ALL' && st !== statusTab) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const provName = (r.provider?.businessName || r.provider?.business_name || r.provider?.user?.fullName || '').toLowerCase();
      const provPhone = (r.provider?.user?.phone || '').toLowerCase();
      const provCity = (r.provider?.city || '').toLowerCase();
      const servName = (r.service?.name || '').toLowerCase();

      return provName.includes(q) || provPhone.includes(q) || provCity.includes(q) || servName.includes(q);
    });
  }, [rates, statusTab, search]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#16A34A]" />
            <span>Provider Menu & Services Approval (Swiggy Partner Flow)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review and approve custom services, menu offerings, and pricing uploaded by providers before they appear in the customer mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv('Provider_Services_Approvals', rates)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setStatusTab('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-xl font-black text-amber-600 block mt-1 font-mono">
            {pendingCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Requires Admin approval</span>
        </div>

        <div
          onClick={() => setStatusTab('APPROVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'APPROVED'
              ? 'bg-[#EFF8E7] border-[#16A34A]/40 ring-2 ring-[#16A34A]/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Approved & Live</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
          </div>
          <span className="text-xl font-black text-[#16A34A] block mt-1 font-mono">
            {approvedCount}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-0.5 block font-semibold">Bookable by customers</span>
        </div>

        <div
          onClick={() => setStatusTab('REJECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusTab === 'REJECTED'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Rejected Services</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-600 block mt-1 font-mono">
            {rejectedCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Not visible in app</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-md bg-[#FAF9F5] rounded-2xl border border-slate-200 flex items-center px-4 py-2.5 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search provider, phone, city, or service..."
              className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl text-xs font-bold">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusTab === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'PENDING'
                  ? `Pending (${pendingCount})`
                  : tab === 'APPROVED'
                  ? `Approved (${approvedCount})`
                  : tab === 'REJECTED'
                  ? `Rejected (${rejectedCount})`
                  : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Services Approval Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Provider Specialist</th>
                <th className="py-3 px-3">Offered Service</th>
                <th className="py-3 px-3">Catalog Price</th>
                <th className="py-3 px-3">Provider Requested Price</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Live Status</th>
                <th className="py-3 px-3 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading provider services queue from database...
                  </td>
                </tr>
              ) : filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No services found matching current status filter.
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => {
                  const base = r.service?.basePrice || r.service?.base_price || 0;
                  const custom = r.customPrice ?? r.custom_price ?? base;
                  const duration = r.customDuration ?? r.custom_duration ?? r.service?.durationMinutes ?? r.service?.duration_minutes ?? 45;
                  const st = r.approvalStatus || r.approval_status || 'PENDING';
                  const diffPct = base > 0 ? Math.round(((custom - base) / base) * 100) : 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">
                          {r.provider?.businessName || r.provider?.business_name || r.provider?.user?.fullName || 'Provider'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {r.provider?.user?.phone || 'No phone'} • {r.provider?.city || 'Warangal'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {r.service?.name || 'Custom Service'}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {r.service?.description || 'Custom service uploaded by provider'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-500">
                        ₹{base || 499}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-black text-slate-900 text-sm">₹{custom}</span>
                          {base > 0 && diffPct !== 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                diffPct > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-600">
                        {duration} mins
                      </td>

                      <td className="py-3.5 px-3">
                        {st === 'APPROVED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Live & Bookable</span>
                          </span>
                        ) : st === 'REJECTED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 animate-spin" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {st !== 'APPROVED' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleDecision(r.id, 'APPROVE')}
                              className="px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {st !== 'REJECTED' && (
                            <button
                              disabled={actionLoading}
                              onClick={() => {
                                setRejectModalItem(r);
                                setRejectReason('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                            >
                              Reject
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

      {/* Rejection Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-900">Reject Service Submission</h3>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Service:{' '}
                <strong className="text-slate-900">
                  {rejectModalItem.service?.name || 'Custom Service'}
                </strong>
              </p>
              <p>
                Provider:{' '}
                <strong className="text-slate-900">
                  {rejectModalItem.provider?.businessName ||
                    rejectModalItem.provider?.user?.fullName ||
                    'Provider'}
                </strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection (Visible to Provider) *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Price is significantly above standard catalog rate. Please adjust pricing or provide detailed service description."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectReason.trim()}
                onClick={() => handleDecision(rejectModalItem.id, 'REJECT', rejectReason.trim())}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

