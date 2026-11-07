import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Calendar, Search, Filter, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';

export const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, [filterStatus]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getBookings(filterStatus === 'ALL' ? undefined : filterStatus);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.bookingRef.toLowerCase().includes(q) ||
      b.service?.name.toLowerCase().includes(q) ||
      b.customer?.user?.fullName?.toLowerCase().includes(q) ||
      b.provider?.businessName?.toLowerCase().includes(q) ||
      b.provider?.user?.fullName?.toLowerCase().includes(q)
    );
  });

  const statuses = ['ALL', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <span>Master Bookings & Appointments Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-tenant appointment directory with concurrency-backed slot validation and financial tracking.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === s
                  ? 'bg-charcoal-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ref, customer, provider..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Reference ID</th>
                <th className="px-6 py-3.5">Service Item</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Appointment Slot</th>
                <th className="px-6 py-3.5">Financial Breakdown</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No appointments match your active filter.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {b.bookingRef}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{b.service?.name}</p>
                      <p className="text-[11px] text-slate-400">{b.service?.durationMinutes} mins duration</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{b.customer?.user?.fullName || 'Customer'}</p>
                      <p className="text-[11px] text-slate-400">{b.customer?.user?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {b.provider?.businessName || b.provider?.user?.fullName || 'Provider'}
                      </p>
                      <p className="text-[11px] text-slate-400">{b.provider?.city}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{b.date}</span>
                      <p className="text-slate-500 text-[11px] font-mono">
                        {b.startTime} - {b.endTime}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">₹{b.totalAmount}</p>
                      <p className="text-[10px] text-slate-500">
                        Split: <span className="text-brand-600 font-semibold">₹{b.platformCommission} Platform</span> / <span className="text-slate-800 font-semibold">₹{b.providerEarnings} Provider</span>
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : b.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {b.status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {b.status === 'CANCELLED' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

