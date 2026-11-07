import React from 'react';
import { Settings, Shield, Bell, Database, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          <span>System & Platform Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Global platform parameters, SMS OTP integration, security credentials, and database settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* Core Platform */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Globe className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Platform Identity</h3>
              <p className="text-xs text-slate-500">Quick Appointments production parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Platform Name</label>
              <input
                type="text"
                disabled
                value="QUICK APPOINTMENTS"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Slot Reservation Hold Duration</label>
              <input
                type="text"
                disabled
                value="10 Minutes (Pessimistic concurrency lock)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Security & OTP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Shield className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Authentication & Gateway Security</h3>
              <p className="text-xs text-slate-500">Mobile OTP, JWT session security and payment webhook validation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">OTP Verification Gateway</label>
              <input
                type="text"
                disabled
                value="Fast2SMS / Twilio Production Ready"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Webhook Signatures</label>
              <input
                type="text"
                disabled
                value="HMAC-SHA256 Razorpay Verification"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

