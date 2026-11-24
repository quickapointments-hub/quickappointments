import React, { useEffect, useState } from 'react';
import { mobileApi } from '../../api';
import { ArrowLeft, Coins, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ProviderEarningsScreen: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
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
    <div className="pb-24 px-5 pt-4 space-y-4 bg-[#FFFFFF] text-[#111111] min-h-full">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full bg-white border border-[#E8E4D9] text-[#111111] hover:bg-[#FFFFFF] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-black font-display text-[#111111] tracking-tight">
            Earnings & Payouts
          </h2>
          <p className="text-xs text-[#4B5563] font-medium">Gross volume, platform fees & net settlements</p>
        </div>
      </div>

      {/* Main Stats Card (Clean White Surface with Brand Green Accent) */}
      <div className="p-6 rounded-3xl bg-white text-[#111111] shadow-sm border border-[#E8E4D9] space-y-4">
        <div>
          <span className="text-xs font-semibold text-[#4B5563]">Total Net Payout Balance</span>
          <div className="text-3xl font-black font-display text-[#111111] mt-1">
            ₹{(earnings.totalNet || 0).toLocaleString()}
          </div>
        </div>

        <div className="pt-3 border-t border-[#F2EFE8] grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#4B5563]">Gross Customer Volume</span>
            <p className="font-bold text-[#111111] mt-0.5">₹{(earnings.totalGross || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-[#4B5563]">Platform Commission (5%)</span>
            <p className="font-bold text-[#65B32E] mt-0.5">₹{(earnings.totalPlatformFee || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Settlement Records */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-[#111111]">Settlement Ledger</h3>

        {(earnings.history || []).length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E4D9] text-xs text-[#4B5563]">
            No completed settlements yet. Earnings are recorded automatically after every fulfilled appointment.
          </div>
        ) : (
          earnings.history.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-[#111111] font-mono text-[11px]">
                  Booking Ref: #{item.bookingId.slice(0, 8)}
                </p>
                <p className="text-[10px] text-[#4B5563] mt-0.5">
                  Platform fee: ₹{item.platformFee} • Settled to Bank
                </p>
              </div>
              <span className="font-black text-[#65B32E] text-sm">
                +₹{item.netPayout}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
