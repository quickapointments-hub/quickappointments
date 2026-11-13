import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Users,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  Activity,
  Check,
} from 'lucide-react';

interface BookingPoint {
  label: string;
  count: number;
}

export const DashboardPage: React.FC<{ onNavigateToKyc?: () => void }> = ({ onNavigateToKyc }) => {
  const [metrics, setMetrics] = useState<any>({
    customers: 0,
    providers: 0,
    appointments: 0,
    completed: 0,
    pending: 0,
    totalRevenue: 0,
  });
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'This Year'>('Last 30 Days');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveMetrics();

    // Supabase Real-time updates
    const channel = supabase
      .channel('dashboard-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadLiveMetrics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        loadLiveMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLiveMetrics = async () => {
    try {
      setLoading(true);
      const [res, bookingsRes] = await Promise.allSettled([
        api.getMetrics(),
        api.getBookings(),
      ]);

      if (res.status === 'fulfilled' && res.value?.data) {
        const m = res.value.data;
        setMetrics({
          customers: m.totalCustomers || 0,
          providers: m.totalProviders || 0,
          appointments: m.totalBookings || 0,
          completed: m.completedBookings || 0,
          pending: m.pendingVerifications || 0,
          totalRevenue: m.grossRevenue || 0,
        });

        if (m.recentBookings && m.recentBookings.length > 0) {
          setRecentBookings(
            m.recentBookings.map((b: any) => ({
              id: b.id,
              customerName: b.customer?.user?.full_name || 'Customer',
              serviceName: b.service?.name || 'Service',
              providerName: b.provider?.business_name || 'Provider',
              dateTime: `${b.date || 'Today'}, ${b.start_time || '10:00 AM'}`,
              status: b.status || 'CONFIRMED',
              amount: b.total_amount || 0,
            }))
          );
        } else {
          setRecentBookings([]);
        }
      }

      if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value?.data)) {
        setAllBookings(bookingsRes.value.data);
      }
    } catch (err) {
      console.warn('Dashboard metrics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group real database bookings by selected date range
  const chartIntervals = useMemo<BookingPoint[]>(() => {
    const now = new Date();
    const intervals: BookingPoint[] = [];

    if (dateRange === 'Last 7 Days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const count = allBookings.filter((b) => {
          const bDate = b.date || (b.created_at ? b.created_at.slice(0, 10) : '');
          return bDate === dayStr;
        }).length;
        intervals.push({ label, count });
      }
    } else if (dateRange === 'Last 30 Days') {
      // 6 intervals of 5 days
      for (let i = 5; i >= 0; i--) {
        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - (i * 5 + 4));
        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - i * 5);
        const label = i === 0 ? 'Today' : dEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.date || b.created_at || now);
          return bDate >= dStart && bDate <= dEnd;
        }).length;
        intervals.push({ label, count });
      }
    } else if (dateRange === 'This Month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const bucketSize = Math.ceil(daysInMonth / 4);

      for (let w = 0; w < 4; w++) {
        const startDay = w * bucketSize + 1;
        const endDay = Math.min((w + 1) * bucketSize, daysInMonth);
        const label = `${startDay}-${endDay} ${now.toLocaleDateString('en-GB', { month: 'short' })}`;
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.date || b.created_at || now);
          return (
            bDate.getFullYear() === year &&
            bDate.getMonth() === month &&
            bDate.getDate() >= startDay &&
            bDate.getDate() <= endDay
          );
        }).length;
        intervals.push({ label, count });
      }
    } else {
      // This Year (12 months)
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const label = d.toLocaleDateString('en-GB', { month: 'short' });
        const count = allBookings.filter((b) => {
          const bDate = new Date(b.date || b.created_at || now);
          return bDate.getFullYear() === year && bDate.getMonth() === m;
        }).length;
        intervals.push({ label, count });
      }
    }

    return intervals;
  }, [allBookings, dateRange]);

  const totalBookingsInPeriod = useMemo(
    () => chartIntervals.reduce((sum, item) => sum + item.count, 0),
    [chartIntervals]
  );

  // Dynamic SVG path calculation
  const { pathD, fillD, plotPoints } = useMemo(() => {
    if (chartIntervals.length === 0 || totalBookingsInPeriod === 0) {
      return { pathD: '', fillD: '', plotPoints: [] };
    }

    const maxCount = Math.max(...chartIntervals.map((i) => i.count), 1);
    const startX = 30;
    const endX = 570;
    const width = endX - startX;
    const topY = 30;
    const bottomY = 160;
    const height = bottomY - topY;

    const pts = chartIntervals.map((pt, idx) => {
      const x = startX + (idx / (chartIntervals.length - 1)) * width;
      const y = bottomY - (pt.count / maxCount) * height;
      return { x, y, label: pt.label, count: pt.count };
    });

    // Catmull-Rom or smooth cubic bezier curve
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const fill = `${d} L ${pts[pts.length - 1].x},${bottomY + 10} L ${pts[0].x},${bottomY + 10} Z`;

    return { pathD: d, fillD: fill, plotPoints: pts };
  }, [chartIntervals, totalBookingsInPeriod]);

  // Dynamic Fulfillment Progress
  const fulfillmentRate =
    metrics.appointments > 0 ? Math.round((metrics.completed / metrics.appointments) * 100) : 0;
  const remainingBookings = Math.max(0, metrics.appointments - metrics.completed);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header: Title & Interactive Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real-time overview of appointments, revenue, customers, and active service providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20">
                {(['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setDateRange(r);
                      setShowDateDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between ${
                      dateRange === r ? 'bg-emerald-50 text-[#16A34A] font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{r}</span>
                    {dateRange === r && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Customers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block font-mono">
              {metrics.customers}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Registered users</span>
          </div>
        </div>

        {/* Card 2: Service Providers */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Service Providers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block font-mono">
              {metrics.providers}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Active partners</span>
          </div>
        </div>

        {/* Card 3: Appointments */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Appointments</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block font-mono">
              {metrics.appointments}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Total booked</span>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block font-mono">
              ₹{metrics.totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Gross volume</span>
          </div>
        </div>

        {/* Card 5: Completed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-slate-900 block font-mono">
              {metrics.completed}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Fulfilled</span>
          </div>
        </div>

        {/* Card 6: Pending KYC */}
        <div
          onClick={onNavigateToKyc}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#16A34A] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Pending KYC</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-amber-600 block font-mono">
              {metrics.pending}
            </span>
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
              Review queue <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Fulfillment Progress Indicator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#16A34A]" />
            <span className="text-xs font-bold text-slate-900">
              Appointment Fulfillment Progress
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Completed: <strong className="text-slate-900">{metrics.completed}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">
              In-Queue / Ongoing: <strong className="text-slate-900">{remainingBookings}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-[#16A34A]">{fulfillmentRate}%</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#16A34A] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${fulfillmentRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
          <span>0%</span>
          <span>
            {metrics.appointments === 0
              ? 'No appointments in progress'
              : `${metrics.completed} of ${metrics.appointments} appointments fulfilled`}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Main Charts & Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Appointments Overview Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900">Appointments Overview</h2>
              <p className="text-xs text-slate-400 font-medium">
                Real booking traffic trends • {dateRange}
              </p>
            </div>
            <span className="text-xs font-bold text-[#16A34A] bg-[#EFF8E7] px-3 py-1 rounded-full border border-[#16A34A]/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              Active Database Sync ({totalBookingsInPeriod} Bookings)
            </span>
          </div>

          {/* Chart Display: Dynamic SVG or Clean Empty State */}
          {totalBookingsInPeriod === 0 ? (
            <div className="h-60 w-full flex flex-col items-center justify-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-2 shadow-xs">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No Appointments Recorded for {dateRange}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Appointments booked by customers will dynamically plot on this live timeline graph.
              </p>
              <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-mono mt-8 px-4 border-t border-slate-200/60 pt-2">
                {chartIntervals.map((pt, i) => (
                  <span key={i}>{pt.label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-60 w-full pt-4 relative">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Grid Guidelines */}
                <line x1="20" y1="160" x2="580" y2="160" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="20" y1="95" x2="580" y2="95" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="20" y1="30" x2="580" y2="30" stroke="#F1F5F9" strokeWidth="1" />

                {/* Area Fill */}
                {fillD && <path d={fillD} fill="url(#chartGradient)" />}

                {/* Main Stroke Path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points */}
                {plotPoints.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#16A34A"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="hover:scale-125 transition-transform"
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip on Hover */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none bg-slate-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg shadow-lg font-sans -translate-x-1/2 -translate-y-full mb-2 z-10 whitespace-nowrap"
                  style={{
                    left: `${(hoveredPoint.x / 600) * 100}%`,
                    top: `${(hoveredPoint.y / 200) * 100}%`,
                  }}
                >
                  <div className="font-bold">{hoveredPoint.label}</div>
                  <div className="text-emerald-300">{hoveredPoint.count} Appointment{hoveredPoint.count === 1 ? '' : 's'}</div>
                </div>
              )}

              {/* X-axis Labels */}
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-4 mt-1">
                {chartIntervals.map((pt, i) => (
                  <span key={i}>{pt.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Recent Appointments Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900">Recent Appointments</h2>
              <span className="text-[11px] font-bold text-slate-400">Latest 5</span>
            </div>

            <div className="divide-y divide-slate-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                        {b.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {b.serviceName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 block font-mono">
                        ₹{b.amount}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          b.status === 'COMPLETED'
                            ? 'bg-[#EFF8E7] text-[#16A34A]'
                            : b.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No appointments booked yet.
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Bookings created by customers will appear here in real time.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

