import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mobileApi } from '../api';
import { Phone, KeyRound, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+919811122233');
  const [fullName, setFullName] = useState('Pooja Verma');
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      await mobileApi.requestOtp(phone, role);
      setOtpSent(true);
      setOtp('123456'); // Pre-fill development test OTP
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      await login(phone, otp, fullName, role);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-50">
      {/* Brand Header */}
      <div className="pt-8 text-center">
        <div className="inline-block p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md mb-4">
          <img src="/logo.png" alt="Quick Appointments" className="h-16 w-auto object-contain mx-auto" />
        </div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight">
          Welcome to Quick Appointments
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {otpSent ? 'Enter the 6-digit OTP dispatched to your number' : 'Sign in or create account via verified mobile OTP'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 my-auto">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {!otpSent ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Pooja Verma"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919811122233"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registering As:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    role === 'CUSTOMER'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('PROVIDER')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    role === 'PROVIDER'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Service Provider
                </button>
              </div>
            </div>

            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loading ? 'Sending OTP...' : 'Send Verification OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter 6-Digit OTP
                </label>
                <span className="text-[11px] text-slate-400">Dispatched to {phone}</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 text-sm tracking-widest text-center font-bold font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <p className="text-[10px] text-brand-600 font-medium mt-1.5 text-center">
                Development Test OTP: 123456
              </p>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Enter App'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setOtpSent(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-2"
            >
              Change Phone Number
            </button>
          </>
        )}
      </div>

      {/* Trust Badge */}
      <div className="text-center py-4 text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-brand-600" />
        <span>Enterprise Concurrency & End-to-End Encryption</span>
      </div>
    </div>
  );
};

