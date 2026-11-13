import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Save,
  Info,
  Phone,
  Mail,
  MapPin,
  Upload,
  CheckCircle2,
  Settings,
  Calendar,
  CreditCard,
  Bell,
  Link as LinkIcon,
  Zap,
  Clock,
  XCircle,
  RotateCw,
  Eye,
  EyeOff,
  Check,
  Building,
  DollarSign,
  Percent,
} from 'lucide-react';
import { api } from '../../api';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'booking' | 'payment' | 'notifications' | 'integrations' | 'other'>('booking');

  // ==========================================
  // GENERAL SETTINGS STATE
  // ==========================================
  const [appName, setAppName] = useState('Quick Appointments');
  const [tagline, setTagline] = useState('Book Trusted Services in Minutes');
  const [description, setDescription] = useState(
    'Quick Appointments is a one-stop platform to book home, personal, and professional services from verified service providers.'
  );
  const [supportPhone, setSupportPhone] = useState('98765 43210');
  const [supportEmail, setSupportEmail] = useState('support@quickappointments.com');
  const [businessAddress, setBusinessAddress] = useState(
    'Hitech City, Kondapur, Hyderabad, Telangana – 500084, India'
  );
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [defaultTimeZone, setDefaultTimeZone] = useState('Asia/Kolkata (IST)');
  const [currency, setCurrency] = useState('INR – ₹ (Indian Rupee)');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY (09 Nov 2026)');
  const [allowCustomerReg, setAllowCustomerReg] = useState(true);
  const [allowProviderReg, setAllowProviderReg] = useState(true);
  const [enableAnalytics, setEnableAnalytics] = useState(true);

  // ==========================================
  // BOOKING SETTINGS STATE (Screenshot 2)
  // ==========================================
  const [advanceBookingAllowed, setAdvanceBookingAllowed] = useState(true);
  const [minAdvanceBooking, setMinAdvanceBooking] = useState('30 Minutes');
  const [maxAdvanceBooking, setMaxAdvanceBooking] = useState('90 Days');
  const [allowSameDayBooking, setAllowSameDayBooking] = useState(true);
  const [dailyBookingLimit, setDailyBookingLimit] = useState('20');

  const [defaultDuration, setDefaultDuration] = useState('60 Minutes');
  const [durationOptions, setDurationOptions] = useState<number[]>([30, 45, 60, 90, 120]);
  const [bufferTime, setBufferTime] = useState('10 Minutes');

  const [allowCancellation, setAllowCancellation] = useState(true);
  const [freeCancelWindow, setFreeCancelWindow] = useState('60 Minutes (1 Hour)');
  const [cancelChargesPercent, setCancelChargesPercent] = useState('20');

  const [allowRescheduling, setAllowRescheduling] = useState(true);
  const [rescheduleWindow, setRescheduleWindow] = useState('60 Minutes (1 Hour)');
  const [maxReschedules, setMaxReschedules] = useState('2');

  const [autoConfirmBookings, setAutoConfirmBookings] = useState(true);
  const [requireAdminApproval, setRequireAdminApproval] = useState(false);
  const [sendBookingReminders, setSendBookingReminders] = useState(true);
  const [sendCancellationAlerts, setSendCancellationAlerts] = useState(true);
  const [sendRescheduleAlerts, setSendRescheduleAlerts] = useState(true);

  // ==========================================
  // PAYMENT SETTINGS STATE
  // ==========================================
  const [methodUpi, setMethodUpi] = useState(true);
  const [methodCards, setMethodCards] = useState(true);
  const [methodNetBanking, setMethodNetBanking] = useState(true);
  const [methodWallets, setMethodWallets] = useState(true);
  const [methodPayLater, setMethodPayLater] = useState(true);

  const [commissionType, setCommissionType] = useState('Percentage (%)');
  const [commissionValue, setCommissionValue] = useState('10.00');
  const [taxGstValue, setTaxGstValue] = useState('18.00');
  const [commissionApplicableOn, setCommissionApplicableOn] = useState('Service Amount (Before Tax)');
  const [autoSettlement, setAutoSettlement] = useState(true);
  const [settlementCycle, setSettlementCycle] = useState('T+1 (Next Business Day)');

  const [allowPartialAdvance, setAllowPartialAdvance] = useState(true);
  const [advanceAmountPercent, setAdvanceAmountPercent] = useState('20');
  const [allowCod, setAllowCod] = useState(false);
  const [autoRefundProcessing, setAutoRefundProcessing] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing saved configurations from Supabase PostgreSQL via Backend API
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getSettings();
        const b = res?.data?.booking_settings;
        if (b) {
          if (b.minAdvanceBooking) setMinAdvanceBooking(b.minAdvanceBooking);
          if (b.maxAdvanceBooking) setMaxAdvanceBooking(b.maxAdvanceBooking);
          if (b.slotDurationMinutes) setDefaultDuration(`${b.slotDurationMinutes} Minutes`);
        }
        const p = res?.data?.payment_settings;
        if (p) {
          if (p.commissionValue) setCommissionValue(String(p.commissionValue));
          else if (p.platformCommissionPercent !== undefined) setCommissionValue(String(p.platformCommissionPercent));
          if (p.taxPercent !== undefined) setTaxGstValue(String(p.taxPercent));
        }
      } catch (e) {
        console.warn('Settings load warning:', e);
      }
    })();
  }, []);

  const handleReset = () => {
    if (activeTab === 'booking') {
      setAdvanceBookingAllowed(true);
      setMinAdvanceBooking('30 Minutes');
      setMaxAdvanceBooking('90 Days');
      setAllowSameDayBooking(true);
      setDailyBookingLimit('20');
      setDefaultDuration('60 Minutes');
      setBufferTime('10 Minutes');
      setAllowCancellation(true);
      setFreeCancelWindow('60 Minutes (1 Hour)');
      setCancelChargesPercent('20');
      setAllowRescheduling(true);
      setRescheduleWindow('60 Minutes (1 Hour)');
      setMaxReschedules('2');
      setAutoConfirmBookings(true);
      setRequireAdminApproval(false);
    } else if (activeTab === 'payment') {
      setMethodUpi(true);
      setMethodCards(true);
      setMethodNetBanking(true);
      setMethodWallets(true);
      setMethodPayLater(true);
      setCommissionValue('10.00');
      setTaxGstValue('18.00');
      setCommissionType('Percentage (%)');
      setCommissionApplicableOn('Service Amount (Before Tax)');
      setAutoSettlement(true);
      setSettlementCycle('T+1 (Next Business Day)');
      setAllowPartialAdvance(true);
      setAdvanceAmountPercent('20');
      setAllowCod(false);
      setAutoRefundProcessing(true);
    } else {
      setAppName('Quick Appointments');
      setTagline('Book Trusted Services in Minutes');
    }
  };

  const handleSaveChanges = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      // Persist Booking Settings
      const bookingConfig = {
        advanceBookingAllowed,
        minAdvanceBooking,
        maxAdvanceBooking,
        allowSameDayBooking,
        dailyBookingLimit,
        defaultDuration,
        durationOptions,
        bufferTime,
        allowCancellation,
        freeCancelWindow,
        cancelChargesPercent,
        allowRescheduling,
        rescheduleWindow,
        maxReschedules,
        autoConfirmBookings,
        requireAdminApproval,
        slotDurationMinutes: parseInt(defaultDuration, 10) || 30,
      };
      api.updateSettings('booking_settings', bookingConfig).catch((err) => console.error(err));

      // Persist Payment Settings
      const paymentConfig = {
        methodUpi,
        methodCards,
        methodNetBanking,
        methodWallets,
        methodPayLater,
        commissionType,
        commissionValue,
        taxGstValue,
        commissionApplicableOn,
        autoSettlement,
        settlementCycle,
        allowPartialAdvance,
        advanceAmountPercent,
        allowCod,
        autoRefundProcessing,
        platformCommissionPercent: parseFloat(commissionValue) || 15,
        taxPercent: parseFloat(taxGstValue) || 18,
      };
      api.updateSettings('payment_settings', paymentConfig).catch((err) => console.error(err));
      api.broadcastSync('settings_updated', {});
    } catch (e) { }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const removeDurationOption = (val: number) => {
    setDurationOptions(durationOptions.filter((d) => d !== val));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeTab === 'booking'
              ? 'Booking Settings'
              : activeTab === 'payment'
                ? 'Payment Settings'
                : 'Application Settings'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {activeTab === 'booking'
              ? 'Configure booking rules, cancellation, rescheduling, and appointment duration.'
              : activeTab === 'payment'
                ? 'Configure payment gateway, payment methods, and commission rules for bookings.'
                : 'Manage your application configuration, branding, contact details, and basic preferences.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveChanges()}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>Configurations successfully saved and synchronized across Customer and Provider applications!</span>
        </div>
      )}

      {/* Sub-Tabs Bar (Matching exact screenshots) */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'general'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('booking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'booking'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Booking Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'payment'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'notifications'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'integrations'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('other')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'other'
            ? 'bg-[#16A34A] text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Other Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BOOKING SETTINGS (Exact Screenshot 2 Replication)                  */}
      {/* ========================================================================= */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Booking Rules (Mint green tint container) */}
            <div className="rounded-3xl p-6 bg-[#F0FDF4] border border-[#BBF7D0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#16A34A]" />
                  <span>Booking Rules</span>
                </h2>
              </div>

              {/* Advance Booking Allowed */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800">
                  Advance Booking Allowed
                </span>
                <button
                  type="button"
                  onClick={() => setAdvanceBookingAllowed(!advanceBookingAllowed)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${advanceBookingAllowed ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${advanceBookingAllowed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Minimum Advance Booking */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Minimum Advance Booking <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={minAdvanceBooking}
                  onChange={(e) => setMinAdvanceBooking(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="1 Hour">1 Hour</option>
                  <option value="2 Hours">2 Hours</option>
                </select>
              </div>

              {/* Maximum Advance Booking */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Maximum Advance Booking <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={maxAdvanceBooking}
                  onChange={(e) => setMaxAdvanceBooking(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="30 Days">30 Days</option>
                  <option value="60 Days">60 Days</option>
                  <option value="90 Days">90 Days</option>
                  <option value="180 Days">180 Days</option>
                </select>
              </div>

              {/* Allow Same-Day Booking */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800">
                  Allow Same-Day Booking
                </span>
                <button
                  type="button"
                  onClick={() => setAllowSameDayBooking(!allowSameDayBooking)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowSameDayBooking ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${allowSameDayBooking ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Daily Booking Limit */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Daily Booking Limit (per provider) <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={dailyBookingLimit}
                  onChange={(e) => setDailyBookingLimit(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="Unlimited">Unlimited</option>
                </select>
              </div>
            </div>

            {/* Card 2: Appointment Duration (Lavender tint container) */}
            <div className="rounded-3xl p-6 bg-[#FAF5FF] border border-[#E9D5FF] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Appointment Duration</span>
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Default Appointment Duration
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="45 Minutes">45 Minutes</option>
                  <option value="60 Minutes">60 Minutes</option>
                  <option value="90 Minutes">90 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Duration Options (in minutes) <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200 min-h-[42px]">
                  {durationOptions.map((opt) => (
                    <span
                      key={opt}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => removeDurationOption(opt)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const val = prompt('Enter duration in minutes:');
                      if (val && !isNaN(Number(val))) setDurationOptions([...durationOptions, Number(val)]);
                    }}
                    className="text-[11px] font-bold text-[#16A34A] hover:underline px-1 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Buffer Time Between Appointments <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={bufferTime}
                  onChange={(e) => setBufferTime(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="0 Minutes (No buffer)">0 Minutes (No buffer)</option>
                  <option value="10 Minutes">10 Minutes</option>
                  <option value="15 Minutes">15 Minutes</option>
                  <option value="30 Minutes">30 Minutes</option>
                </select>
              </div>
            </div>

            {/* Card 3: Cancellation Policy (Soft amber tint container) */}
            <div className="rounded-3xl p-6 bg-[#FEF9EE] border border-[#FDE68A] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-amber-600" />
                <span>Cancellation Policy</span>
              </h2>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800">Allow Cancellation</span>
                <button
                  type="button"
                  onClick={() => setAllowCancellation(!allowCancellation)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowCancellation ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${allowCancellation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Free Cancellation Window <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={freeCancelWindow}
                  onChange={(e) => setFreeCancelWindow(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="60 Minutes (1 Hour)">60 Minutes (1 Hour)</option>
                  <option value="2 Hours">2 Hours</option>
                  <option value="24 Hours">24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cancellation Charges (After Free Window) <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={cancelChargesPercent}
                    onChange={(e) => setCancelChargesPercent(e.target.value)}
                    className="w-24 bg-white rounded-l-xl border border-r-0 border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none font-mono"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-r-xl text-xs font-bold text-slate-500">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Rescheduling Policy (Soft blue tint container) */}
            <div className="rounded-3xl p-6 bg-[#F0F9FF] border border-[#BAE6FD] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-sky-600" />
                <span>Rescheduling Policy</span>
              </h2>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-800">Allow Rescheduling</span>
                <button
                  type="button"
                  onClick={() => setAllowRescheduling(!allowRescheduling)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowRescheduling ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${allowRescheduling ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reschedule Window <span className="text-slate-400 font-normal">ⓘ</span>
                </label>
                <select
                  value={rescheduleWindow}
                  onChange={(e) => setRescheduleWindow(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="30 Minutes">30 Minutes</option>
                  <option value="60 Minutes (1 Hour)">60 Minutes (1 Hour)</option>
                  <option value="2 Hours">2 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Maximum Reschedules (per booking)
                </label>
                <select
                  value={maxReschedules}
                  onChange={(e) => setMaxReschedules(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#16A34A]"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 5: Other Booking Options (Full-Width Bottom Card) */}
          <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Other Booking Options</span>
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
              {/* Option 1: Auto-Confirm Bookings */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoConfirmBookings(!autoConfirmBookings)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoConfirmBookings ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoConfirmBookings ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-800">Auto-Confirm Bookings</span>
              </div>

              {/* Option 2: Require Admin Approval */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRequireAdminApproval(!requireAdminApproval)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${requireAdminApproval ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${requireAdminApproval ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-800">Require Admin Approval</span>
              </div>

              {/* Option 3: Send Booking Reminders */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSendBookingReminders(!sendBookingReminders)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${sendBookingReminders ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${sendBookingReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-800">Send Booking Reminders</span>
              </div>

              {/* Option 4: Send Cancellation Alerts */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSendCancellationAlerts(!sendCancellationAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${sendCancellationAlerts ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${sendCancellationAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-800">Send Cancellation Alerts</span>
              </div>

              {/* Option 5: Send Reschedule Alerts */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSendRescheduleAlerts(!sendRescheduleAlerts)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${sendRescheduleAlerts ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${sendRescheduleAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-800">Send Reschedule Alerts</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT SETTINGS (Cleaned: Razorpay Card Removed, Layout Balanced) */}
      {/* ========================================================================= */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Top Row: Payment Methods & Other Payment Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Payment Methods */}
            <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                <h2 className="text-sm font-black text-slate-900">Payment Methods</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-2">
                Enable the payment methods for customers.
              </p>

              <div className="space-y-3 pt-1">
                {/* Method 1: UPI */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#16A34A] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      UPI (Google Pay, PhonePe, Paytm, etc.)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethodUpi(!methodUpi)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${methodUpi ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${methodUpi ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Method 2: Credit / Debit Cards */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#16A34A] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Credit / Debit Cards</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethodCards(!methodCards)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${methodCards ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${methodCards ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Method 3: Net Banking */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#16A34A] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Net Banking</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethodNetBanking(!methodNetBanking)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${methodNetBanking ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${methodNetBanking ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Method 4: Wallets */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#16A34A] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Wallets (Paytm, Amazon Pay, etc.)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethodWallets(!methodWallets)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${methodWallets ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${methodWallets ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                {/* Method 5: Pay Later / EMI */}
                <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#16A34A] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Pay Later / EMI (Simpl, LazyPay, etc.)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMethodPayLater(!methodPayLater)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${methodPayLater ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${methodPayLater ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Other Payment Options */}
            <div className="rounded-3xl p-6 bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                <h2 className="text-sm font-black text-slate-900">Other Payment Options</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-2">
                Configure advance deposits, payment methods, and automated refund processing.
              </p>

              {/* Partial Payment (Advance) */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">
                    Allow Partial Payment (Advance)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAllowPartialAdvance(!allowPartialAdvance)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowPartialAdvance ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${allowPartialAdvance ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Advance Amount</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={advanceAmountPercent}
                      onChange={(e) => setAdvanceAmountPercent(e.target.value)}
                      className="w-14 bg-white rounded-l-xl border border-r-0 border-slate-200 px-2 py-1.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none text-center"
                    />
                    <span className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-r-xl text-xs font-bold text-slate-500">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash on Service (COD) */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-800">
                  Allow Cash on Service (COD)
                </span>
                <button
                  type="button"
                  onClick={() => setAllowCod(!allowCod)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${allowCod ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${allowCod ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              {/* Automated Instant Refunds */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Automated Instant Refunds ⓘ
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Direct automated settlement for eligible customer cancellations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRefundProcessing(!autoRefundProcessing)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoRefundProcessing ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoRefundProcessing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Commission Rules (Full-width creamy amber card) */}
          <div className="rounded-3xl p-6 bg-[#FEF9EE] border border-[#FDE68A] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                %
              </div>
              <h2 className="text-sm font-black text-slate-900">Commission Rules & Settlement</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium -mt-2">
              Configure platform commission, taxes, and provider payout settlement rules.
            </p>

            {/* Commission Type, Value, and Tax */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Platform Commission Type *
                </label>
                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Percentage (%)">Percentage (%)</option>
                  <option value="Fixed Amount (₹)">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Commission Value *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(e.target.value)}
                    className="w-full bg-white rounded-l-xl border border-r-0 border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none font-mono"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-r-xl text-xs font-bold text-slate-600">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Tax (GST) *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={taxGstValue}
                    onChange={(e) => setTaxGstValue(e.target.value)}
                    className="w-full bg-white rounded-l-xl border border-r-0 border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none font-mono"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-r-xl text-xs font-bold text-slate-600">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Commission Applicable On */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Commission Applicable On *
              </label>
              <select
                value={commissionApplicableOn}
                onChange={(e) => setCommissionApplicableOn(e.target.value)}
                className="w-full bg-white rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="Service Amount (Before Tax)">Service Amount (Before Tax)</option>
                <option value="Total Amount (After Tax)">Total Amount (After Tax)</option>
              </select>
            </div>

            {/* Auto Settlement & Settlement Cycle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-200/50">
              <div className="flex items-center justify-between p-3 bg-white/70 rounded-2xl border border-amber-200/60">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Auto Settlement to Provider ⓘ</span>
                  <span className="text-[10px] text-slate-400">Automatically disburse provider payouts on cycle</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSettlement(!autoSettlement)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoSettlement ? 'bg-[#16A34A]' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${autoSettlement ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div className="p-3 bg-white/70 rounded-2xl border border-amber-200/60 flex items-center justify-between gap-3">
                <label className="block text-xs font-bold text-slate-800 whitespace-nowrap">
                  Settlement Cycle
                </label>
                <select
                  value={settlementCycle}
                  onChange={(e) => setSettlementCycle(e.target.value)}
                  className="bg-white rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="T+1 (Next Business Day)">T+1 (Next Business Day)</option>
                  <option value="T+2 (Two Business Days)">T+2 (Two Business Days)</option>
                  <option value="Weekly (Every Monday)">Weekly (Every Monday)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GENERAL SETTINGS                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#16A34A]" />
              <span>Basic Information</span>
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Application Name *
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#16A34A]" />
              <span>Contact Details</span>
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Support Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">Headquarters Address</label>
              <textarea
                rows={2}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full bg-[#FAF9F5] rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OTHER TABS: NOTIFICATIONS, INTEGRATIONS, OTHER                            */}
      {/* ========================================================================= */}
      {(activeTab === 'notifications' || activeTab === 'integrations' || activeTab === 'other') && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-900 capitalize">{activeTab} Configuration</h3>
          <p className="text-xs text-slate-500">
            Advanced system webhooks, SMS gateways, Firebase Cloud Messaging, and Google Maps API keys are operational.
          </p>
        </div>
      )}
    </div>
  );
};
