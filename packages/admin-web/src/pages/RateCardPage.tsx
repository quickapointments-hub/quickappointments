import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Tag, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const RateCardPage: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      const res = await api.getPendingRates();
      setRates(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (rateId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.decideRateCard(rateId, action);
      setSuccessMsg(`Custom rate successfully ${action.toLowerCase()}d!`);
      await loadRates();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Decision failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand-600" />
          <span>Provider Custom Rate Approvals Queue</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Two-tier catalog governance. Review provider-requested custom rates before they become bookable by customers.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Provider Specialist</th>
              <th className="px-6 py-3.5">Service Name</th>
              <th className="px-6 py-3.5">Base Catalog Price</th>
              <th className="px-6 py-3.5">Requested Custom Price</th>
              <th className="px-6 py-3.5">Difference</th>
              <th className="px-6 py-3.5 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Loading rate card requests...
                </td>
              </tr>
            ) : rates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No pending custom rate approvals. All provider rates are verified.
                </td>
              </tr>
            ) : (
              rates.map((r) => {
                const base = r.service?.basePrice || 0;
                const custom = r.customPrice || base;
                const diffPct = base > 0 ? Math.round(((custom - base) / base) * 100) : 0;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{r.provider?.businessName || r.provider?.user?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {r.provider?.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{r.service?.name}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-600">₹{base}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">₹{custom}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          diffPct >= 0
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {diffPct >= 0 ? `+${diffPct}%` : `${diffPct}%`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDecision(r.id, 'APPROVE')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(r.id, 'REJECT')}
                          className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-all"
                        >
                          Reject
                        </button>
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
  );
};

