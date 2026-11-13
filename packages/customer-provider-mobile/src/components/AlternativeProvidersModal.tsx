import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import { AlertCircle, Star, ShieldCheck, ArrowRight, X, RefreshCw } from 'lucide-react';

interface AlternativeProvidersModalProps {
  booking: any;
  onSelectAlternative: (provider: any) => void;
  onClose: () => void;
}

export const AlternativeProvidersModal: React.FC<AlternativeProvidersModalProps> = ({
  booking,
  onSelectAlternative,
  onClose,
}) => {
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlternatives();
  }, [booking.id]);

  const loadAlternatives = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getAlternatives(booking.id);
      setAlternatives(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#FDFCF4] rounded-3xl p-6 shadow-2xl border border-[#E8E4D9] text-[#111111] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Banner */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E8E4D9]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111] bg-[#EFF8E7] px-2 py-0.5 rounded-full border border-[#65B32E]">
              Specialist Unavailable
            </span>
            <h3 className="font-bold font-display text-base text-[#111111]">
              Your payment was not charged
            </h3>
            <p className="text-xs text-[#4B5563] font-medium">
              Recommended top-rated specialists nearby with available slots:
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alternatives List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#65B32E]" />
              <span>Finding nearby alternatives...</span>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="p-6 text-center bg-white border border-[#E8E4D9] rounded-2xl text-xs text-[#4B5563]">
              No immediate alternative providers found in your city today. Please try selecting a different date.
            </div>
          ) : (
            alternatives.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-[#E8E4D9] bg-white shadow-sm flex items-center justify-between hover:border-[#65B32E] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] text-[#111111] font-bold flex items-center justify-center text-sm">
                    {(p.businessName || p.user?.fullName || 'P').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-[#111111]">
                        {p.businessName || p.user?.fullName}
                      </h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#65B32E]" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#111111] mt-0.5">
                      <Star className="w-3 h-3 fill-[#65B32E] text-[#65B32E]" />
                      <span>{p.ratingAvg}</span>
                      <span className="text-[#6B7280] font-normal">({p.ratingCount})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectAlternative(p)}
                  className="px-3 py-1.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
