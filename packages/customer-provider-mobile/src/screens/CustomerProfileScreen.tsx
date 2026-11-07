import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, ShieldCheck, Repeat, LogOut, ChevronRight, HelpCircle } from 'lucide-react';

export const CustomerProfileScreen: React.FC = () => {
  const { user, switchRole, logout } = useAuth();

  return (
    <div className="pb-24 px-5 pt-4 space-y-5">
      <div>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          My Account
        </h2>
        <p className="text-xs text-slate-500">Preferences, profile & role switcher</p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-charcoal-900 text-brand-500 font-bold font-display flex items-center justify-center text-lg">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-slate-900 truncate">
            {user?.fullName || 'Quick Customer'}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.phone}</p>
          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold mt-1.5">
            Active Mode: Customer
          </span>
        </div>
      </div>

      {/* Multi-Role Switcher Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-charcoal-900 to-charcoal-950 text-white shadow-xl border border-charcoal-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold">
            <Repeat className="w-4 h-4" />
            <span>Dual Role Switcher</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
            Provider Mode
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Are you a certified service professional? Switch instantly to Provider Mode to manage bookings, schedule your working hours, and review earnings.
        </p>

        <button
          onClick={() => switchRole('PROVIDER')}
          className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-charcoal-900 font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
        >
          <span>Switch to Provider Dashboard</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Links */}
      <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs">
          <div className="flex items-center gap-3 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Security & Privacy Policies</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs">
          <div className="flex items-center gap-3 text-slate-700 font-medium">
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span>Help & Customer Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div
          onClick={logout}
          className="p-4 flex items-center justify-between hover:bg-rose-50 cursor-pointer transition-colors text-xs text-rose-600 font-semibold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </div>
      </div>
    </div>
  );
};

