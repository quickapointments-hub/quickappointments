import React, { useState } from 'react';
import { api } from '../../api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Users,
  HardHat,
  CalendarCheck,
  Layers,
  BarChart3,
  Settings,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

type AuthViewMode = 'login' | 'forgot_request' | 'forgot_verify';

const PLATFORM_FEATURES = [
  {
    title: 'Customers Management',
    icon: Users,
  },
  {
    title: 'Service Providers',
    icon: HardHat,
  },
  {
    title: 'Appointments & Bookings',
    icon: CalendarCheck,
  },
  {
    title: 'Services & Categories',
    icon: Layers,
  },
  {
    title: 'Reports & Analytics',
    icon: BarChart3,
  },
  {
    title: 'Platform Settings',
    icon: Settings,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const validateLoginForm = (): boolean => {
    const nextErrors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (trimmedEmail.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateLoginForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin(email.trim(), password);
      if (res?.user) {
        onLoginSuccess(res.user);
      } else {
        setError('Invalid authentication response returned by server.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setResetEmail(email.trim());
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setDevOtpHint(null);
    setViewMode('forgot_request');
  };

  const backToLogin = () => {
    setError(null);
    setFieldErrors({});
    setDevOtpHint(null);
    setViewMode('login');
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const target = resetEmail.trim();
    if (!target) {
      setError('Please enter your administrator email address or registered mobile number.');
      return;
    }
    if (target.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotAdminPassword(target);
      setSuccessMessage(res.message || 'Verification code issued. Check your inbox and continue below.');
      setDevOtpHint(res.devOtp || null);
      setViewMode('forgot_verify');
    } catch (err: any) {
      setError(err.message || 'Unable to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!resetOtp.trim() || resetOtp.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetAdminPassword(resetEmail.trim(), resetOtp.trim(), newPassword);
      setEmail(resetEmail.trim());
      setPassword('');
      setDevOtpHint(null);
      setSuccessMessage(res.message || 'Password reset successfully. Sign in with your new password.');
      setViewMode('login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-[#F8FCFA] via-[#FFFFFF] to-[#EFFAF3] px-4 py-10 sm:px-8 lg:px-14">
      {/* Soft top-right & bottom-right floating botanical leaf accents matching reference */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="animate-qa-float pointer-events-none absolute -right-4 top-8 hidden h-28 w-28 opacity-80 md:block"
      >
        <defs>
          <linearGradient id="qaLeafTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <path
          d="M98 18 C52 22 24 54 18 98 C64 92 94 64 98 18 Z"
          fill="url(#qaLeafTop)"
        />
        <path
          d="M22 94 C48 70 72 44 96 20"
          stroke="#15803D"
          strokeWidth="2.5"
          strokeOpacity="0.45"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="animate-qa-float pointer-events-none absolute bottom-16 right-4 z-20 hidden h-20 w-20 opacity-85 md:block"
        style={{ animationDelay: '1.8s' }}
      >
        <defs>
          <linearGradient id="qaLeafBottom" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path
          d="M84 14 C42 20 18 48 14 86 C54 80 80 54 84 14 Z"
          fill="url(#qaLeafBottom)"
        />
        <path
          d="M18 82 C40 60 62 38 82 16"
          stroke="#15803D"
          strokeWidth="2"
          strokeOpacity="0.45"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Mint wave floor ribbons matching reference */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40 overflow-hidden">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M0,45 C240,145 520,165 820,105 C1100,48 1290,90 1440,55 L1440,200 L0,200 Z"
            fill="#C7F3D6"
            fillOpacity="0.7"
          />
          <path
            d="M0,105 C310,185 670,70 1010,120 C1210,148 1340,105 1440,85 L1440,200 L0,200 Z"
            fill="#A9ECC0"
            fillOpacity="0.65"
          />
        </svg>
      </div>

      {/* Main Responsive Two-Column Split Container */}
      <div className="relative z-10 mx-auto grid w-full max-w-[1220px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* LEFT COLUMN: Branding, Hero Headline & 6 Platform Feature Cards */}
        <div className="lg:col-span-6 xl:col-span-6">
          {/* Original Quick Appointments Logo */}
          <div className="mb-6 flex items-center">
            <img
              src="/logo.png"
              alt="Quick Appointments"
              className="h-14 w-auto object-contain sm:h-16"
            />
          </div>

          {/* Admin Panel Pill Badge */}
          <div className="mb-4 inline-flex items-center rounded-full bg-[#D3F4DC] px-4 py-1.5 text-sm font-semibold tracking-tight text-[#15803D]">
            Admin Panel
          </div>

          {/* Hero Headline */}
          <h1 className="font-display text-[34px] font-extrabold leading-[1.14] tracking-tight text-[#1E293B] sm:text-[42px] xl:text-[46px]">
            Manage Your
            <span className="relative mt-1 block text-[#159947]">
              Appointment Platform
              <svg
                aria-hidden="true"
                viewBox="0 0 280 18"
                className="mt-1 h-3 w-52 sm:w-64"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="qaUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4ADE80" />
                    <stop offset="50%" stopColor="#16A34A" />
                    <stop offset="100%" stopColor="#BBF7D0" />
                  </linearGradient>
                </defs>
                <path
                  d="M4,10 C80,17 190,15 276,6 C200,9 95,11 4,10 Z"
                  fill="url(#qaUnderline)"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-[#475569] sm:text-base">
            Efficiently manage customers, service providers, appointments, services and platform
            operations from a single dashboard.
          </p>

          {/* 6 Feature Cards (3x2 grid on desktop, 2x3 on tablet/mobile) */}
          <div className="mt-9 grid max-w-[560px] grid-cols-2 gap-3.5 sm:grid-cols-3">
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group flex items-center gap-3 rounded-2xl border border-[#E2F3E8] bg-[#F4FBF6]/90 px-3.5 py-3.5 shadow-[0_4px_14px_rgba(22,163,74,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BBF7D0] hover:bg-white hover:shadow-[0_10px_24px_rgba(22,163,74,0.09)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF8EE] text-[#16A34A] transition-colors group-hover:bg-[#DCFCE7]">
                    <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} />
                  </div>
                  <span className="text-[12.5px] font-semibold leading-snug text-[#1E293B]">
                    {feature.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: White Elevated Admin Login Card (No Promotional Laptop, No Secure & Protected Footer) */}
        <div className="flex justify-center lg:col-span-6 lg:justify-end xl:col-span-6">
          <div className="w-full max-w-[465px] rounded-[28px] border border-slate-100 bg-white px-7 py-9 shadow-[0_24px_64px_rgba(15,23,42,0.08)] sm:px-10 sm:py-11">
            {/* Top Green Shield Emblem */}
            <div className="mb-5 flex justify-center">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className="h-14 w-14 drop-shadow-[0_8px_16px_rgba(22,163,74,0.28)]"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="qaShieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38D36B" />
                      <stop offset="100%" stopColor="#14803B" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M32 5 L53 12.5 V30.5 C53 44.5 43.8 54.6 32 59 C20.2 54.6 11 44.5 11 30.5 V12.5 L32 5 Z"
                    fill="url(#qaShieldGrad)"
                  />
                </svg>
                {viewMode === 'login' ? (
                  <Lock className="absolute h-5 w-5 text-white" strokeWidth={2.2} />
                ) : (
                  <KeyRound className="absolute h-5 w-5 text-white" strokeWidth={2.2} />
                )}
              </div>
            </div>

            {/* Card Title & Subtitle */}
            <div className="mb-7 text-center">
              <h2 className="font-display text-[26px] font-bold tracking-tight text-[#1E293B]">
                {viewMode === 'login'
                  ? 'Admin Login'
                  : viewMode === 'forgot_request'
                  ? 'Reset Admin Password'
                  : 'Verify & Update Password'}
              </h2>
              <p className="mt-1.5 text-[14px] text-[#64748B]">
                {viewMode === 'login'
                  ? 'Sign in to access the Quick Appointments Admin Panel.'
                  : viewMode === 'forgot_request'
                  ? 'Enter your administrator email or mobile number to receive a verification code.'
                  : 'Enter the 6-digit verification code and choose a strong new password.'}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-3.5 py-3 text-xs font-medium text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-3 text-xs font-medium text-emerald-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* VIEW 1: ADMIN LOGIN FORM */}
            {viewMode === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-5">
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                  >
                    <Mail className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                    <span>Email Address</span>
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    placeholder="Enter your email address"
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                      fieldErrors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="admin-password"
                      className="flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                    >
                      <Lock className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-[12.5px] font-semibold text-[#16A34A] transition-colors hover:text-[#15803D] hover:underline focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl border bg-white py-3 pl-4 pr-11 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                        fieldErrors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : 'border-slate-200 focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <Eye className="h-[18px] w-[18px]" />
                      ) : (
                        <EyeOff className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#137C3A] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(22,163,74,0.28)] transition-all hover:from-[#16A34A] hover:via-[#15803D] hover:to-[#0F6930] hover:shadow-[0_14px_30px_rgba(22,163,74,0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-[18px] w-[18px]" strokeWidth={2.2} />
                      <span>Login</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 2: FORGOT PASSWORD — REQUEST CODE */}
            {viewMode === 'forgot_request' && (
              <form onSubmit={handleRequestResetOtp} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                  >
                    <Mail className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                    <span>Admin Email or Mobile</span>
                  </label>
                  <input
                    id="reset-email"
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@quickappointments.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#137C3A] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(22,163,74,0.28)] transition-all hover:from-[#16A34A] hover:to-[#0F6930] disabled:opacity-65"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex w-full items-center justify-center gap-1.5 pt-1 text-xs font-semibold text-slate-500 transition-colors hover:text-[#16A34A]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Admin Login</span>
                </button>
              </form>
            )}

            {/* VIEW 3: FORGOT PASSWORD — VERIFY OTP & SET NEW PASSWORD */}
            {viewMode === 'forgot_verify' && (
              <form onSubmit={handleConfirmResetPassword} noValidate className="space-y-4">
                {devOtpHint && (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-[#F4FBF6] px-3.5 py-2.5 text-xs text-[#15803D]">
                    <span>
                      Dev Verification Code: <strong className="font-mono">{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(devOtpHint)}
                      className="rounded-md bg-[#16A34A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#15803D]"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="reset-otp"
                    className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                    <span>Verification Code</span>
                  </label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm font-semibold tracking-widest text-slate-900 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 outline-none transition-all focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-admin-password"
                    className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                  >
                    <Lock className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                    <span>New Password</span>
                  </label>
                  <div className="relative">
                    <input
                      id="new-admin-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    >
                      {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-admin-password"
                    className="mb-1.5 flex items-center gap-2 text-[13px] font-bold text-[#1E293B]"
                  >
                    <Lock className="h-4 w-4 text-[#16A34A]" strokeWidth={2.2} />
                    <span>Confirm New Password</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-admin-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#16A34A] focus:ring-4 focus:ring-[#16A34A]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#137C3A] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_26px_rgba(22,163,74,0.28)] transition-all hover:from-[#16A34A] hover:to-[#0F6930] disabled:opacity-65"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-[#16A34A]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestResetOtp}
                    disabled={loading}
                    className="font-semibold text-[#16A34A] hover:text-[#15803D] hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
