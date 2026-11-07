import React, { useEffect, useState } from 'react';
import { mobileApi } from '../api';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const CustomerBookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getCustomerBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'UPCOMING') return ['CONFIRMED', 'PENDING', 'IN_PROGRESS'].includes(b.status);
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          My Appointments
        </h2>
        <p className="text-xs text-slate-500">Scheduled bookings & service history</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200">
        {(['UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">No {filter.toLowerCase()} appointments</p>
            <p className="text-[11px] text-slate-400">New bookings will appear here instantly.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {b.bookingRef}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 mt-0.5">{b.service?.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {b.provider?.businessName || b.provider?.user?.fullName}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : b.status === 'COMPLETED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>{b.date}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{b.startTime} - {b.endTime}</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Paid via {b.paymentMethod}</span>
                <span className="font-bold font-display text-slate-900">₹{b.totalAmount}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

