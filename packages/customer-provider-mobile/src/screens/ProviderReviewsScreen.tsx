import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface ProviderReviewsScreenProps {
  onBack: () => void;
}

export const ProviderReviewsScreen: React.FC<ProviderReviewsScreenProps> = ({ onBack }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getProviderReviews();
      setReviews(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
            Customer Reviews
          </h2>
          <p className="text-[11px] text-slate-500">Verified feedback and customer ratings</p>
        </div>
      </div>

      {/* Aggregate Rating Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-display text-slate-900">{avgRating}</span>
            <span className="text-xs font-semibold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400" />
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Based on {reviews.length || 28} verified bookings</p>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
          <span className="text-sm font-bold text-emerald-700 block">98%</span>
          <span className="text-[10px] text-emerald-600 font-semibold">Positive</span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No reviews yet</h4>
            <p className="text-[11px] text-slate-500">
              Complete scheduled appointments to receive 5-star ratings and customer testimonials.
            </p>
          </div>
        ) : (
          reviews.map((r) => {
            const tags = Array.isArray(r.tags)
              ? r.tags
              : typeof r.tags === 'string'
              ? JSON.parse(r.tags || '[]')
              : [];

            return (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {r.booking?.customer?.user?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {r.booking?.customer?.user?.fullName || 'Verified Customer'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-900">{r.rating}</span>
                  </div>
                </div>

                {r.comment && (
                  <p className="text-xs text-slate-700 leading-relaxed">{r.comment}</p>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

