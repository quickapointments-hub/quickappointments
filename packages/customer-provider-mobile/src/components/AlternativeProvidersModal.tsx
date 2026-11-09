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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header Banner */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Provider Unavailable
            </span>
            <h3 className="font-bold font-display text-base text-slate-900">
              Your payment was not charged
            </h3>
            <p className="text-xs text-slate-500">
              Recommended top-rated specialists nearby with available slots:
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alternatives List */}
        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
              <span>Finding nearby alternatives...</span>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
              No immediate alternative providers found in your city today. Please try selecting a different date.
            </div>
          ) : (
            alternatives.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between hover:border-brand-500 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 font-bold flex items-center justify-center text-sm">
                    {(p.businessName || p.user?.fullName || 'P').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-slate-900">
                        {p.businessName || p.user?.fullName}
                      </h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{p.ratingAvg}</span>
                      <span className="text-slate-400 font-normal">({p.ratingCount})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectAlternative(p)}
                  className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                >
                  <span>Book</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
        >
          Return to Home Discovery
        </button>
      </div>
    </div>
  );
};

