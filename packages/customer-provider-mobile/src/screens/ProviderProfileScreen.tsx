import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, ShieldCheck, Repeat, LogOut, ChevronRight, HelpCircle } from 'lucide-react';

export const ProviderProfileScreen: React.FC = () => {
  const { user, switchRole, logout } = useAuth();

  return (
    <div className="pb-24 px-5 pt-4 space-y-5">
      <div>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          Provider Account
        </h2>
        <p className="text-xs text-slate-500">Business settings & profile preferences</p>
      </div>

      {/* Provider Details Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 font-bold font-display flex items-center justify-center text-lg">
          {(user?.providerProfile?.businessName || user?.fullName || 'P').charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-slate-900 truncate">
              {user?.providerProfile?.businessName || user?.fullName}
            </h3>
            <ShieldCheck className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.phone}</p>
          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold mt-1.5">
            Active Mode: Provider Cockpit
          </span>
        </div>
      </div>

      {/* Switcher back to Customer Mode */}
      <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
            <Repeat className="w-4 h-4 text-brand-600" />
            <span>Dual Role Switcher</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-mono text-slate-600">
            Customer Mode
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Want to discover services or book an appointment as a customer? Switch instantly to Customer Mode.
        </p>

        <button
          onClick={() => switchRole('CUSTOMER')}
          className="w-full py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Switch to Customer Mode</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs">
          <div className="flex items-center gap-3 text-slate-700 font-medium">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <span>Provider KYC & Document Hub</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs">
          <div className="flex items-center gap-3 text-slate-700 font-medium">
            <HelpCircle className="w-4 h-4 text-brand-600" />
            <span>Provider Partner Support</span>
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

