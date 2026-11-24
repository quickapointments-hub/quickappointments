import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Calendar,
  Clock,
  CheckCircle2,
  RotateCw,
  XCircle,
  Plus,
  Download,
  Search,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Briefcase,
} from 'lucide-react';

interface AppointmentItem {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone?: string;
  customerInitial: string;
  serviceName: string;
  providerName: string;
  dateTime: string;
  amount: number;
  status: string;
}

export const BookingsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Confirmed' | 'Checked_In' | 'Ongoing' | 'Completed' | 'Cancelled' | 'No_Show'>('All');
  const [search, setSearch] = useState('');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadBookings();

    const channel = supabase
      .channel('bookings-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getBookings();
      if (res?.data) {
        const mapped: AppointmentItem[] = res.data.map((b: any) => {
          const cName =
            b.customer?.user?.fullName ||
            b.customer?.user?.full_name ||
            b.customer?.fullName ||
            b.customerName ||
            'Customer';
          const reasonStr = String(b.cancellationReason || b.cancellation_reason || '').toLowerCase();
          const rawStatus = String(b.status || 'CONFIRMED').toUpperCase();
          const isNoShow = rawStatus === 'NO_SHOW' || (rawStatus === 'CANCELLED' && reasonStr.includes('no show'));
          const isCheckedIn = rawStatus === 'CHECKED_IN' || (rawStatus === 'IN_PROGRESS' && reasonStr.includes('checked in'));
          return {
            id: b.id,
            bookingRef: b.bookingRef || b.booking_ref || `QA-${b.id.slice(0, 6)}`,
            customerName: cName,
            customerPhone: b.customer?.user?.phone || b.customerPhone || '',
            customerInitial: cName.charAt(0).toUpperCase(),
            serviceName: b.service?.name || b.serviceName || 'Service',
            providerName:
              b.provider?.businessName ||
              b.provider?.business_name ||
              b.providerName ||
              'Service Provider',
            dateTime: `${b.date || 'Today'}, ${b.startTime || b.start_time || '10:00 AM'}`,
            amount: b.totalAmount ?? b.total_amount ?? 0,
            status: isNoShow ? 'NO_SHOW' : isCheckedIn ? 'CHECKED_IN' : rawStatus,
          };
        });
          setAppointments(mapped);
        }
      } catch (e) {
        console.warn('Error loading bookings from database:', e);
      } finally {
        setLoading(false);
      }
    };

    // Dynamic KPI Stats calculated from real database rows
    const totalAppointments = appointments.length;
    const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
    const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const checkedInCount = appointments.filter((a) => a.status === 'CHECKED_IN').length;
    const ongoingCount = appointments.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'ONGOING').length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
    const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length;

    const handleUpdateStatus = async (id: string, newStatus: string) => {
      setActionLoadingId(id);
      setOpenActionId(null);
      setFeedback(null);
      try {
        await api.updateBookingStatus(id, newStatus);
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus.toUpperCase() } : a))
        );
        setFeedback({
          type: 'success',
          message: `Appointment status updated to ${newStatus.replace('_', ' ')}.`,
        });
        setTimeout(() => setFeedback(null), 4000);
        loadBookings();
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Failed to update status: ${err.message || 'Server error'}`,
        });
      } finally {
        setActionLoadingId(null);
      }
    };

  const filtered = appointments.filter((apt) => {
    if (activeTab === 'Checked_In') {
      if (apt.status !== 'CHECKED_IN') return false;
    } else if (activeTab === 'No_Show') {
      if (apt.status !== 'NO_SHOW') return false;
    } else if (activeTab !== 'All' && apt.status !== activeTab.toUpperCase()) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      apt.bookingRef.toLowerCase().includes(q) ||
      apt.customerName.toLowerCase().includes(q) ||
      apt.serviceName.toLowerCase().includes(q) ||
      apt.providerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Appointment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitor real-time bookings, provider assignments, schedules, and appointment fulfillments.
          </p>
        </div>

        <button
          onClick={() => {
            const csv =
              'Booking Ref,Customer,Service,Provider,Date Time,Amount,Status\n' +
              appointments
                .map(
                  (a) =>
                    `"${a.bookingRef}","${a.customerName}","${a.serviceName}","${a.providerName}","${a.dateTime}","₹${a.amount}","${a.status}"`
                )
                .join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'appointments_ledger.csv';
            a.click();
          }}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Ledger</span>
        </button>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
            feedback.type === 'success'
              ? 'bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/30'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5 KPI Stat Cards (Matching Reference Screenshot - Dynamic from DB) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Total Bookings</span>
          <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
            {totalAppointments}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Recorded</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Pending</span>
          <span className="text-xl font-black text-amber-600 block mt-1 font-mono">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-600 mt-0.5 block font-semibold">Awaiting start</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Confirmed</span>
          <span className="text-xl font-black text-blue-600 block mt-1 font-mono">
            {confirmedCount}
          </span>
          <span className="text-[10px] text-blue-600 mt-0.5 block font-semibold">Scheduled</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Completed</span>
          <span className="text-xl font-black text-[#16A34A] block mt-1 font-mono">
            {completedCount}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-0.5 block font-semibold">Fulfilled</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Cancelled</span>
          <span className="text-xl font-black text-rose-600 block mt-1 font-mono">
            {cancelledCount}
          </span>
          <span className="text-[10px] text-rose-600 mt-0.5 block font-semibold">Refunded</span>
        </div>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] rounded-2xl border border-slate-200/60 overflow-x-auto max-w-fit">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'All'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Appointments ({totalAppointments})
          </button>
          <button
            onClick={() => setActiveTab('Confirmed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'Confirmed'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab('Checked_In')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'Checked_In'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Checked In ({checkedInCount})
          </button>
          <button
            onClick={() => setActiveTab('Ongoing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'Ongoing'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            In Service ({ongoingCount})
          </button>
          <button
            onClick={() => setActiveTab('Completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'Completed'
              ? 'bg-[#16A34A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('Cancelled')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'Cancelled'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Cancelled ({cancelledCount})
          </button>
          <button
            onClick={() => setActiveTab('No_Show')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'No_Show'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            No Show ({noShowCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full bg-[#FAF9F5] rounded-2xl border border-slate-200 flex items-center px-4 py-2.5 text-xs">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking reference, customer name, service, or provider..."
            className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
          />
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Booking Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Service</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Schedule</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading live appointments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No appointments found in database.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-[#16A34A] bg-[#EFF8E7] px-2.5 py-1 rounded-lg border border-[#16A34A]/20">
                        {apt.bookingRef}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0">
                          {apt.customerInitial}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{apt.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{apt.customerPhone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {apt.serviceName}
                    </td>

                    <td className="py-3.5 px-3 text-slate-700">
                      {apt.providerName}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {apt.dateTime}
                    </td>

                    <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">
                      ₹{apt.amount}
                    </td>

                    <td className="py-3.5 px-3">
                      {apt.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20">
                          Completed
                        </span>
                      ) : apt.status === 'CONFIRMED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Confirmed
                        </span>
                      ) : apt.status === 'CHECKED_IN' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Checked In
                        </span>
                      ) : apt.status === 'IN_PROGRESS' || apt.status === 'ONGOING' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          In Service
                        </span>
                      ) : apt.status === 'CANCELLED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      ) : apt.status === 'NO_SHOW' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          No Show
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
                          {apt.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() => setOpenActionId(openActionId === apt.id ? null : apt.id)}
                          disabled={actionLoadingId === apt.id}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === apt.id ? (
                            <RotateCw className="w-4 h-4 animate-spin text-[#16A34A]" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>

                        {openActionId === apt.id && (
                          <div className="origin-top-right absolute right-0 mt-1 w-44 rounded-2xl shadow-xl bg-white border border-slate-100 py-1.5 z-20">
                            {apt.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'CHECKED_IN')}
                                className="w-full text-left px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50 font-semibold flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verify Check-In</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-[#EFF8E7] hover:text-[#16A34A] font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'NO_SHOW')}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Mark No Show</span>
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel &amp; Refund</span>
                            </button>
                          </div>
                        )}
                      </div>
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
