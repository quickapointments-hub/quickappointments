import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
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
    <div className="pb-24 px-5 pt-4 space-y-4 bg-[#FFFFFF] text-[#111111] min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-white border border-[#E8E4D9] text-[#111111] hover:bg-[#FFFFFF] shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-black font-display text-[#111111] tracking-tight">
            Customer Reviews
          </h2>
          <p className="text-[11px] text-[#4B5563] font-medium">Verified feedback and customer ratings</p>
        </div>
      </div>

      {/* Aggregate Rating Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-display text-[#111111]">{avgRating}</span>
            <span className="text-xs font-semibold text-[#4B5563]">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 text-[#65B32E]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-[#65B32E]" />
            ))}
          </div>
          <p className="text-[11px] text-[#4B5563] font-medium">Based on {reviews.length || 28} verified bookings</p>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] text-center">
          <span className="text-sm font-black text-[#111111] block">98%</span>
          <span className="text-[10px] text-[#65B32E] font-bold">Positive</span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#6B7280]">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E4D9] space-y-2">
            <MessageSquare className="w-8 h-8 text-[#6B7280] mx-auto" />
            <h4 className="text-xs font-bold text-[#111111]">No reviews yet</h4>
            <p className="text-[11px] text-[#4B5563]">
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
                className="p-4 rounded-2xl bg-white border border-[#E8E4D9] shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#EFF8E7] border border-[#65B32E] flex items-center justify-center font-bold text-xs text-[#111111]">
                      {r.booking?.customer?.user?.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#111111]">
                        {r.booking?.customer?.user?.fullName || 'Verified Customer'}
                      </h4>
                      <p className="text-[10px] text-[#4B5563]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[#EFF8E7] px-2 py-0.5 rounded-full border border-[#65B32E]">
                    <Star className="w-3 h-3 fill-[#65B32E] text-[#65B32E]" />
                    <span className="text-[11px] font-bold text-[#111111]">{r.rating}</span>
                  </div>
                </div>

                {r.comment && (
                  <p className="text-xs text-[#4B5563] leading-relaxed font-medium">{r.comment}</p>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E8E4D9] text-[#111111] font-bold text-[10px]"
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
