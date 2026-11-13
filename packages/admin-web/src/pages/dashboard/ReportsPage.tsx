import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  IndianRupee,
  Users,
  CheckCircle2,
  Filter,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import { exportToCsv } from '../../utils/exportCsv';

type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'prev_month'
  | 'this_year'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'custom';

interface DateFilterState {
  preset: DatePreset;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export const ReportsPage: React.FC = () => {
  // Preset definitions
  const computeInitialDates = (): DateFilterState => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const monthName = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

    return {
      preset: 'this_month',
      label: `This Month (${monthName})`,
      startDate: firstDay,
      endDate: lastDay,
    };
  };

  const [dateFilter, setDateFilter] = useState<DateFilterState>(computeInitialDates);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [rawTickets, setRawTickets] = useState<any[]>([]);
  const [rawCategories, setRawCategories] = useState<any[]>([]);
  const [rawServices, setRawServices] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [providerCount, setProviderCount] = useState(0);

  // Load live data whenever date boundaries change
  useEffect(() => {
    loadFilteredData();
  }, [dateFilter.startDate, dateFilter.endDate]);

  const loadFilteredData = async () => {
    try {
      setLoading(true);
      setDateError(null);

      const startIso = `${dateFilter.startDate}T00:00:00.000Z`;
      const endIso = `${dateFilter.endDate}T23:59:59.999Z`;

      const [
        bookingsRes,
        ticketsRes,
        categoriesRes,
        servicesRes,
        usersRes,
        providersRes,
      ] = await Promise.allSettled([
        supabase
          .from('bookings')
          .select(`
            id,
            booking_ref,
            total_amount,
            platform_commission,
            provider_earnings,
            status,
            date,
            start_time,
            created_at,
            service:services(name, category:categories(name)),
            provider:provider_profiles(business_name),
            customer:customer_profiles(user:users(full_name, phone, email))
          `)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false }),

        supabase
          .from('support_tickets')
          .select('*')
          .gte('created_at', startIso)
          .lte('created_at', endIso),

        api.getCategories(),
        api.getServices(),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('provider_profiles').select('id', { count: 'exact', head: true }),
      ]);

      if (bookingsRes.status === 'fulfilled' && !bookingsRes.value.error) {
        setRawBookings(bookingsRes.value.data || []);
      } else {
        setRawBookings([]);
      }

      if (ticketsRes.status === 'fulfilled' && !ticketsRes.value.error) {
        setRawTickets(ticketsRes.value.data || []);
      } else {
        setRawTickets([]);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) {
        setRawCategories(categoriesRes.value.data);
      }
      if (servicesRes.status === 'fulfilled' && servicesRes.value?.data) {
        setRawServices(servicesRes.value.data);
      }
      if (usersRes.status === 'fulfilled') {
        setUserCount(usersRes.value.count || 0);
      }
      if (providersRes.status === 'fulfilled') {
        setProviderCount(providersRes.value.count || 0);
      }
    } catch (e: any) {
      console.warn('Reports load error:', e);
      setDateError('Could not query database records for the selected period.');
    } finally {
      setLoading(false);
    }
  };

  // Preset Date Range Calculator
  const handleSelectPreset = (preset: DatePreset) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setDateFilter({
        preset,
        label: 'Today',
        startDate: todayStr,
        endDate: todayStr,
      });
    } else if (preset === 'this_week') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff)).toISOString().slice(0, 10);
      const todayStr = now.toISOString().slice(0, 10);
      setDateFilter({
        preset,
        label: 'This Week',
        startDate: monday,
        endDate: todayStr,
      });
    } else if (preset === 'this_month') {
      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const monthName = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      setDateFilter({
        preset,
        label: `This Month (${monthName})`,
        startDate: firstDay,
        endDate: lastDay,
      });
    } else if (preset === 'prev_month') {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const firstDay = new Date(prevYear, prevMonth, 1).toISOString().slice(0, 10);
      const lastDay = new Date(prevYear, prevMonth + 1, 0).toISOString().slice(0, 10);
      const monthName = new Date(prevYear, prevMonth, 1).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      });
      setDateFilter({
        preset,
        label: `Previous Month (${monthName})`,
        startDate: firstDay,
        endDate: lastDay,
      });
    } else if (preset === 'this_year') {
      const firstDay = `${year}-01-01`;
      const lastDay = `${year}-12-31`;
      setDateFilter({
        preset,
        label: `This Year (${year})`,
        startDate: firstDay,
        endDate: lastDay,
      });
    } else if (preset === 'q1') {
      setDateFilter({
        preset,
        label: `Q1 FY ${year} (Apr - Jun)`,
        startDate: `${year}-04-01`,
        endDate: `${year}-06-30`,
      });
    } else if (preset === 'q2') {
      setDateFilter({
        preset,
        label: `Q2 FY ${year} (Jul - Sep)`,
        startDate: `${year}-07-01`,
        endDate: `${year}-09-30`,
      });
    } else if (preset === 'q3') {
      setDateFilter({
        preset,
        label: `Q3 FY ${year} (Oct - Dec)`,
        startDate: `${year}-10-01`,
        endDate: `${year}-12-31`,
      });
    } else if (preset === 'q4') {
      setDateFilter({
        preset,
        label: `Q4 FY ${year} (Jan - Mar)`,
        startDate: `${year}-01-01`,
        endDate: `${year}-03-31`,
      });
    } else if (preset === 'custom') {
      setCustomStart(dateFilter.startDate);
      setCustomEnd(dateFilter.endDate);
      setShowCustomModal(true);
    }
    setShowFilterDropdown(false);
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setDateError('Please enter both Start Date and End Date.');
      return;
    }
    if (new Date(customEnd) < new Date(customStart)) {
      setDateError('Invalid Range: End Date cannot be earlier than Start Date.');
      return;
    }

    setDateFilter({
      preset: 'custom',
      label: `${customStart} to ${customEnd}`,
      startDate: customStart,
      endDate: customEnd,
    });
    setShowCustomModal(false);
  };

  // Dynamically calculate metrics from the real filtered dataset
  const { grossRevenue, platformCommission, netProviderPayout, completedCount, cancelledCount } =
    useMemo(() => {
      let gross = 0;
      let comm = 0;
      let completed = 0;
      let cancelled = 0;

      rawBookings.forEach((b) => {
        const amt = Number(b.total_amount) || 0;
        const bComm = Number(b.platform_commission) || Math.round(amt * 0.15);

        if (b.status === 'COMPLETED' || b.status === 'CONFIRMED') {
          gross += amt;
          comm += bComm;
          completed += 1;
        } else if (b.status === 'CANCELLED' || b.status === 'REFUNDED') {
          cancelled += 1;
        }
      });

      return {
        grossRevenue: gross,
        platformCommission: comm,
        netProviderPayout: Math.max(0, gross - comm),
        completedCount: completed,
        cancelledCount: cancelled,
      };
    }, [rawBookings]);

  const gstAmount = Math.round(platformCommission * 0.18);
  const resolvedTickets = rawTickets.filter((t) => t.status === 'RESOLVED');
  const resolutionRate =
    rawTickets.length > 0
      ? `${Math.round((resolvedTickets.length / rawTickets.length) * 100)}%`
      : '0%';

  // 6 Dynamically populated report modules
  const reportCards = [
    {
      id: 'revenue_commission',
      title: 'Consolidated Revenue & Commission Report',
      period: `${dateFilter.startDate} – ${dateFilter.endDate}`,
      records: `${rawBookings.length.toLocaleString()} Transactions (₹${grossRevenue.toLocaleString('en-IN')})`,
      fileType: 'CSV',
      status: rawBookings.length > 0 ? 'Ready' : 'Zero Data',
      exportHandler: () => {
        exportToCsv(
          `consolidated_revenue_${dateFilter.startDate}_${dateFilter.endDate}.csv`,
          rawBookings.length === 0
            ? [{ Message: 'No transactions recorded for this period' }]
            : rawBookings.map((b) => ({
                'Booking Ref': b.booking_ref || b.id,
                'Booking Date': b.date || b.created_at?.slice(0, 10),
                'Customer Name': b.customer?.user?.full_name || 'Customer',
                'Provider Business': b.provider?.business_name || 'Provider',
                'Service Name': b.service?.name || 'Service',
                'Gross Amount (INR)': b.total_amount || 0,
                'Platform Commission (INR)': b.platform_commission || 0,
                'Provider Payout (INR)': b.provider_earnings || 0,
                Status: b.status,
              }))
        );
      },
    },
    {
      id: 'tax_statutory',
      title: 'GST & TDS Statutory Tax Deductions Report',
      period: `Period: ${dateFilter.startDate} to ${dateFilter.endDate}`,
      records: `18% GST: ₹${gstAmount.toLocaleString('en-IN')} | TDS (1%): ₹${Math.round(netProviderPayout * 0.01).toLocaleString('en-IN')}`,
      fileType: 'Excel / CSV',
      status: grossRevenue > 0 ? 'Ready' : 'Zero Data',
      exportHandler: () => {
        exportToCsv(`tax_statutory_${dateFilter.startDate}_${dateFilter.endDate}.csv`, [
          {
            'Period Start': dateFilter.startDate,
            'Period End': dateFilter.endDate,
            'Total Gross Turnover (INR)': grossRevenue,
            'Platform Earnings (Base) (INR)': platformCommission,
            'CGST (9%) (INR)': Math.round(gstAmount / 2),
            'SGST (9%) (INR)': Math.round(gstAmount / 2),
            'Total GST Liability (18%) (INR)': gstAmount,
            'Total Provider Disbursements (INR)': netProviderPayout,
            'Section 194O TDS Deducted (1%) (INR)': Math.round(netProviderPayout * 0.01),
          },
        ]);
      },
    },
    {
      id: 'provider_payouts',
      title: 'Provider Payout & Commission Reconciliation',
      period: `Settlements: ${dateFilter.startDate} to ${dateFilter.endDate}`,
      records: `₹${netProviderPayout.toLocaleString('en-IN')} Disbursed (${completedCount} Orders)`,
      fileType: 'CSV',
      status: netProviderPayout > 0 ? 'Ready' : 'Zero Data',
      exportHandler: () => {
        exportToCsv(
          `provider_payouts_${dateFilter.startDate}_${dateFilter.endDate}.csv`,
          rawBookings.length === 0
            ? [{ Message: 'No provider disbursements recorded in this period' }]
            : rawBookings
                .filter((b) => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
                .map((b) => ({
                  'Booking Ref': b.booking_ref || b.id,
                  'Provider Business': b.provider?.business_name || 'Provider',
                  'Service Rendered': b.service?.name || 'Service',
                  'Total Collected (INR)': b.total_amount,
                  'Commission Deducted (INR)': b.platform_commission,
                  'Net Settled to Provider (INR)': b.provider_earnings,
                  'Completion Date': b.date || b.created_at?.slice(0, 10),
                }))
        );
      },
    },
    {
      id: 'customer_frequency',
      title: 'Customer Acquisition & Booking Frequency Report',
      period: `Range: ${dateFilter.startDate} to ${dateFilter.endDate}`,
      records: `${userCount} Registered Platform Customers`,
      fileType: 'CSV',
      status: 'Ready',
      exportHandler: () => {
        exportToCsv(`customer_acquisition_${dateFilter.startDate}_${dateFilter.endDate}.csv`, [
          {
            'Total Registered Customers': userCount,
            'Active Bookings in Range': rawBookings.length,
            'Completed Bookings': completedCount,
            'Cancelled / Refunded Bookings': cancelledCount,
            'Gross Customer Spend (INR)': grossRevenue,
            'Average Order Value (INR)':
              completedCount > 0 ? Math.round(grossRevenue / completedCount) : 0,
          },
        ]);
      },
    },
    {
      id: 'category_demand',
      title: 'Service Category Demand & Volume Heatmap',
      period: `Aggregated: ${dateFilter.startDate} to ${dateFilter.endDate}`,
      records: `${rawCategories.length} Categories / ${rawServices.length} Active Services`,
      fileType: 'PDF / CSV',
      status: rawCategories.length > 0 ? 'Ready' : 'Zero Data',
      exportHandler: () => {
        exportToCsv(
          `category_service_demand_${dateFilter.startDate}_${dateFilter.endDate}.csv`,
          rawServices.map((s) => {
            const count = rawBookings.filter((b) => b.service?.name === s.name).length;
            return {
              'Service Name': s.name,
              'Parent Category': s.category?.name || 'Category',
              'Base Price (INR)': s.base_price,
              'Total Bookings in Range': count,
              'Volume Contribution':
                rawBookings.length > 0
                  ? `${Math.round((count / rawBookings.length) * 100)}%`
                  : '0%',
            };
          })
        );
      },
    },
    {
      id: 'support_dispute',
      title: 'Dispute, Refund & Customer Support Resolution Report',
      period: `Period: ${dateFilter.startDate} to ${dateFilter.endDate}`,
      records: `${rawTickets.length} Support Tickets (${resolutionRate} Resolved)`,
      fileType: 'CSV',
      status: rawTickets.length > 0 ? 'Ready' : 'Zero Data',
      exportHandler: () => {
        exportToCsv(
          `support_disputes_${dateFilter.startDate}_${dateFilter.endDate}.csv`,
          rawTickets.length === 0
            ? [{ Message: 'No complaints or dispute tickets recorded in this period' }]
            : rawTickets.map((t) => ({
                'Ticket ID': t.id,
                Subject: t.subject || 'Support Inquiry',
                Status: t.status,
                Priority: t.priority,
                'Created At': t.created_at,
              }))
        );
      },
    },
  ];

  // Consolidated Master Export
  const handleExportAll = () => {
    exportToCsv(`master_consolidated_report_${dateFilter.startDate}_${dateFilter.endDate}.csv`, [
      {
        'Report Generation Time': new Date().toISOString(),
        'Filter Range Start': dateFilter.startDate,
        'Filter Range End': dateFilter.endDate,
        'Filter Preset': dateFilter.label,
        'Total Transactions': rawBookings.length,
        'Completed Orders': completedCount,
        'Cancelled Orders': cancelledCount,
        'Total Gross Volume (INR)': grossRevenue,
        'Platform Fee Commission (INR)': platformCommission,
        'GST 18% Tax (INR)': gstAmount,
        'Net Provider Payouts (INR)': netProviderPayout,
        'Registered Customers': userCount,
        'Registered Providers': providerCount,
        'Support Tickets Logged': rawTickets.length,
        'Support Resolution Rate': resolutionRate,
      },
    ]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Dynamic Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Live database-driven financial ledgers, tax deductions, and operational metrics.
          </p>
        </div>

        <div className="flex items-center gap-3 relative flex-wrap">
          {/* Dynamic Date Filter Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-bold shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{dateFilter.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Presets Popover */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Select Time Period
                </div>

                {[
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'prev_month', label: 'Previous Month' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'q1', label: 'Q1 (Apr - Jun)' },
                  { id: 'q2', label: 'Q2 (Jul - Sep)' },
                  { id: 'q3', label: 'Q3 (Oct - Dec)' },
                  { id: 'q4', label: 'Q4 (Jan - Mar)' },
                  { id: 'custom', label: 'Custom Date Range...' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectPreset(item.id as DatePreset)}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                      dateFilter.preset === item.id
                        ? 'bg-[#EFF8E7] text-[#16A34A] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{item.label}</span>
                    {dateFilter.preset === item.id && (
                      <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export All Button */}
          <button
            onClick={handleExportAll}
            className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-[#16A34A]/30 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[3]" />
            <span>Export Consolidated CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range & Active Filter Notice Banner */}
      <div className="p-3.5 px-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-slate-500 font-medium">Active Date Scope:</span>
          <span className="font-bold text-slate-900 font-mono">
            {dateFilter.startDate} → {dateFilter.endDate}
          </span>
          <span className="text-slate-400 font-medium">({rawBookings.length} bookings queried)</span>
        </div>

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Querying Supabase...</span>
          </div>
        )}
      </div>

      {/* Validation or Error Alert */}
      {dateError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dateError}</span>
          </div>
          <button onClick={() => setDateError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Primary Financial KPI Cards (Dynamically recalculated from filtered records) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Gross Volume</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{grossRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-[#16A34A] font-bold mt-1 inline-flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Live ledger synced
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Platform Earnings (Net)</span>
          <span className="text-xl font-black text-[#16A34A] mt-1 block">
            ₹{platformCommission.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-[#16A34A] font-bold mt-1 inline-flex items-center gap-0.5">
            Platform fee accruals
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">GST Input/Output Tax</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{gstAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            18% GST statutory ledger
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Disbursed Provider Payouts</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{netProviderPayout.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Settled to providers
          </span>
        </div>
      </div>

      {/* 6 Report Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-[#16A34A]" />
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    rep.status === 'Ready'
                      ? 'bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {rep.status}
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 leading-snug">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Period: <span className="text-slate-700 font-mono">{rep.period}</span>
              </p>

              <div className="mt-3 py-2 px-3 rounded-xl bg-[#FAF9F5] border border-slate-100 text-xs text-slate-600 flex items-center justify-between font-mono">
                <span className="truncate max-w-[200px]">{rep.records}</span>
                <span className="text-slate-400 font-sans text-[11px] shrink-0">
                  {rep.fileType}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Matches date filter
              </span>
              <button
                onClick={rep.exportHandler}
                className="px-3.5 py-1.5 rounded-xl bg-[#EFF8E7] hover:bg-[#E4F4DA] text-[#16A34A] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Date Range Picker Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#16A34A]" />
                Select Custom Date Range
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomRange} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer shadow-xs"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
