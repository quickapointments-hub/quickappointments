import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Star,
  Download,
  Search,
  Eye,
  Reply,
  X,
  CheckCircle2,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  customerName: string;
  customerInitial: string;
  serviceName: string;
  providerName: string;
  rating: number;
  reviewText: string;
  dateTime: string;
  reply?: string | null;
}

export const ReviewsRatingsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRating, setSelectedRating] = useState('ALL');
  const [replyReview, setReplyReview] = useState<ReviewItem | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    loadReviews();

    const channel = supabase
      .channel('reviews-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        loadReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getReviews();
      if (res?.data) {
        const mapped: ReviewItem[] = res.data.map((r: any) => {
          const cName = r.customer?.user?.full_name || 'Customer';
          return {
            id: r.id,
            customerName: cName,
            customerInitial: cName.charAt(0).toUpperCase(),
            serviceName: 'Appointment Service',
            providerName: r.provider?.business_name || 'Service Provider',
            rating: Number(r.rating) || 5.0,
            reviewText: r.comment || 'Great experience with professional service.',
            dateTime: new Date(r.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            reply: r.reply,
          };
        });
        setReviews(mapped);
      }
    } catch (e) {
      console.warn('Error loading reviews from database:', e);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic KPI Stats calculated from real database records
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : '5.0';
  const fiveStarReviews = reviews.filter((r) => r.rating >= 4.5).length;
  const criticalReviews = reviews.filter((r) => r.rating <= 2.5).length;

  const handleSendReply = async () => {
    if (!replyReview || !replyMessage.trim()) return;
    try {
      await api.replyToReview(replyReview.id, replyMessage.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === replyReview.id ? { ...r, reply: replyMessage.trim() } : r))
      );
      setReplyReview(null);
      setReplyMessage('');
      alert('Review response published successfully!');
    } catch (err: any) {
      alert(`Failed to save reply: ${err.message}`);
    }
  };

  const filtered = reviews.filter((rev) => {
    if (selectedRating !== 'ALL' && Math.floor(rev.rating).toString() !== selectedRating) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      rev.customerName.toLowerCase().includes(q) ||
      rev.reviewText.toLowerCase().includes(q) ||
      rev.providerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reviews &amp; Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitor customer feedback, ratings, and publish public provider responses.
          </p>
        </div>

        <button
          onClick={() => {
            const csv =
              'Customer,Provider,Rating,Comment,Reply,Date\n' +
              reviews
                .map(
                  (r) =>
                    `"${r.customerName}","${r.providerName}","${r.rating}","${r.reviewText}","${r.reply || ''}","${r.dateTime}"`
                )
                .join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'customer_reviews.csv';
            a.click();
          }}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Reviews</span>
        </button>
      </div>

      {/* 4 KPI Stat Cards (Dynamic from real database) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Average Rating</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xl font-black text-slate-900 font-mono">{avgRating}</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Overall score</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Total Reviews</span>
          <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
            {totalReviews}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">In database</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">5-Star Feedback</span>
          <span className="text-xl font-black text-[#16A34A] block mt-1 font-mono">
            {fiveStarReviews}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-0.5 block font-semibold">High satisfaction</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Needs Attention</span>
          <span className="text-xl font-black text-rose-600 block mt-1 font-mono">
            {criticalReviews}
          </span>
          <span className="text-[10px] text-rose-600 mt-0.5 block font-semibold">Low ratings</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-md bg-[#FAF9F5] rounded-2xl border border-slate-200 flex items-center px-4 py-2.5 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, provider, or review feedback..."
              className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Rating</th>
                <th className="py-3 px-3">Customer Feedback</th>
                <th className="py-3 px-3">Admin / Provider Reply</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading live customer reviews from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No customer reviews found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0">
                          {rev.customerInitial}
                        </div>
                        <span className="font-bold text-slate-900">{rev.customerName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {rev.providerName}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 font-bold font-mono">
                        <span>{rev.rating.toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <span className="text-slate-800 line-clamp-2">{rev.reviewText}</span>
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      {rev.reply ? (
                        <span className="text-[#16A34A] font-medium text-[11px] block truncate">
                          "{rev.reply}"
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No reply yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setReplyReview(rev);
                          setReplyMessage(rev.reply || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#EFF8E7] hover:bg-[#E4F4DA] text-[#16A34A] font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {replyReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Reply to Customer Review</h3>
              <button
                onClick={() => setReplyReview(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{replyReview.customerName}</span>
                <span className="font-bold text-amber-600 flex items-center gap-0.5">
                  ★ {replyReview.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-slate-600">{replyReview.reviewText}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Public Response *
              </label>
              <textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Thank you for your review! We are glad to hear..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#16A34A] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setReplyReview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer text-xs shadow-xs"
              >
                Publish Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
