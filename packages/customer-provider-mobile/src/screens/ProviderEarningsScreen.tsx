import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import { ArrowLeft, Coins, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ProviderEarningsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [earnings, setEarnings] = useState<any>({ totalNet: 0, totalGross: 0, totalPlatformFee: 0, history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getProviderEarnings();
      setEarnings(res.data || { totalNet: 0, totalGross: 0, totalPlatformFee: 0, history: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
            Earnings & Payouts
          </h2>
          <p className="text-xs text-slate-500">Gross volume, platform fees & net settlements</p>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="p-6 rounded-3xl bg-charcoal-900 text-white shadow-xl border border-charcoal-800 space-y-4">
        <div>
          <span className="text-xs font-semibold text-slate-400">Total Net Payout Balance</span>
          <div className="text-3xl font-bold font-display text-brand-400 mt-1">
            ₹{(earnings.totalNet || 0).toLocaleString()}
          </div>
        </div>

        <div className="pt-3 border-t border-charcoal-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400">Gross Customer Volume</span>
            <p className="font-bold text-white mt-0.5">₹{(earnings.totalGross || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-400">Platform Commission (10%)</span>
            <p className="font-bold text-slate-300 mt-0.5">₹{(earnings.totalPlatformFee || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Settlement Records */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Settlement Ledger</h3>

        {(earnings.history || []).length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
            No completed settlements yet. Earnings are recorded automatically after every fulfilled appointment.
          </div>
        ) : (
          earnings.history.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-slate-900 font-mono text-[11px]">
                  Booking Ref: #{item.bookingId.slice(0, 8)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Gross: ₹{item.grossAmount} (Fee: ₹{item.platformFee})
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold font-display text-sm text-brand-700">+₹{item.netEarnings}</p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mt-0.5">
                  Credited
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

