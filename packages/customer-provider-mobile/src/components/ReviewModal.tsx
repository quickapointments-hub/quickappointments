import React, { useState } from 'react';
import { mobileApi } from '../api';
import { Star, X, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
  booking: any;
  onSuccess: () => void;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onSuccess, onClose }) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Professional', 'On time']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTags = ['On time', 'Professional', 'Clean & Hygienic', 'Courteous', 'Great Value', 'Highly Skilled'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await mobileApi.submitReview(booking.id, rating, selectedTags, comment);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Rate Your Experience</span>
            </h3>
            <p className="text-[11px] text-slate-400">{booking.service?.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 5-Star Selector */}
        <div className="text-center py-2 space-y-2">
          <p className="text-xs font-semibold text-slate-600">
            How was your appointment with {booking.provider?.businessName || booking.provider?.user?.fullName}?
          </p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">
            {rating === 5 ? 'Excellent 🌟' : rating === 4 ? 'Very Good 👍' : rating === 3 ? 'Good 🙂' : 'Needs Improvement'}
          </span>
        </div>

        {/* Quick Tags */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Quick Feedback Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((t) => {
              const active = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    active
                      ? 'bg-charcoal-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Review Details (Optional)
          </label>
          <textarea
            rows={3}
            value={comment}
            maxLength={500}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about the quality, timeliness and service..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
          />
          <div className="text-right text-[10px] text-slate-400">{comment.length}/500</div>
        </div>

        {/* Submit CTA */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{submitting ? 'Submitting...' : 'Post Verified Review'}</span>
        </button>
      </div>
    </div>
  );
};

