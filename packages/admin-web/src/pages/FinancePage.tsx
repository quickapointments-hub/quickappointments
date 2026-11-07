import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Coins, Percent, ArrowUpRight, CheckCircle2, TrendingUp, Sliders } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      const [metricsRes, commRes] = await Promise.all([
        api.getMetrics().catch(() => ({ data: {} })),
        api.getCommissionSettings().catch(() => ({ data: [] })),
      ]);
      setMetrics(metricsRes.data || {});
      setSettings(commRes.data || []);
      if (commRes.data?.length > 0) {
        setCommissionRate(commRes.data[0].rate);
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    }
  };

  const handleUpdateCommission = async () => {
    try {
      setIsSaving(true);
      await api.setCommission(Number(commissionRate));
      setSaveSuccess(true);
      await loadFinanceData();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <Coins className="w-5 h-5 text-brand-600" />
          <span>Commissions, Revenue & Financial Settlements</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Dynamic platform commission splits, automated booking fee deductions, and provider payout ledger.
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Gross Processed Volume</span>
          <p className="text-3xl font-bold font-display text-slate-900 mt-2">
            ₹{(metrics?.grossRevenue || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cumulative appointment transactions</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-brand-700">Platform Commission Retained</span>
          <p className="text-3xl font-bold font-display text-brand-600 mt-2">
            ₹{(metrics?.platformCommission || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Net platform SaaS margin</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Net Provider Settlements</span>
          <p className="text-3xl font-bold font-display text-slate-900 mt-2">
            ₹{(metrics?.netProviderPayout || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Credited to verified provider ledgers</p>
        </div>
      </div>

      {/* Commission Setting Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              <span>Platform Take-Rate (Commission Rule Engine)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configured percentage deducted automatically from each confirmed booking
            </p>
          </div>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Commission rule updated!</span>
            </span>
          )}
        </div>

        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Platform Commission Rate (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-32 px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <span className="text-sm font-bold text-slate-500">%</span>
              <button
                onClick={handleUpdateCommission}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Save & Enforce'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Rule applies automatically during booking transaction creation. No hardcoded constants.
          </p>
        </div>

        {/* Commission History Log */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Active Rate Rule History
          </h4>
          <div className="space-y-2">
            {settings.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{s.rate}% Commission</span>
                  <span className="text-slate-400 ml-2 font-mono text-[11px]">
                    Effective from {new Date(s.effectiveFrom).toLocaleDateString()}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Enforced
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

