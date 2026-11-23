import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageModal } from '../../components/LanguageModal';
import {
  Briefcase,
  ShieldCheck,
  Repeat,
  LogOut,
  ChevronRight,
  HelpCircle,
  Star,
  Building2,
  Users,
  Globe,
  Layers,
} from 'lucide-react';

export const ProviderProfileScreen: React.FC<{
  onOpenKyc?: () => void;
  onOpenServices?: () => void;
  onOpenReviews?: () => void;
  onOpenBranches?: () => void;
  onOpenStaff?: () => void;
  onOpenSupport?: () => void;
}> = ({
  onOpenKyc,
  onOpenServices,
  onOpenReviews,
  onOpenBranches,
  onOpenStaff,
  onOpenSupport,
}) => {
    const { user, switchRole, logout } = useAuth();
  const { currentLanguage, languages, t } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const activeLangObj =
    languages.find((l) => l.code === currentLanguage) ||
    languages[0] || { code: 'en', name: 'English', nativeName: 'English' };

  return (
    <div className="pb-24 px-5 pt-4 space-y-5 bg-[#FDFCF4] text-[#111111] min-h-full">
      {/* LANGUAGE SELECTION MODAL */}
      <LanguageModal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
      <div>
        <h2 className="text-lg font-black font-display text-[#111111] tracking-tight">
          Provider Account
        </h2>
        <p className="text-xs text-[#4B5563] font-medium">Business settings & profile preferences</p>
      </div>

        {/* Provider Details Card */}
        <div className="p-5 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF8E7] border border-[#65B32E] text-[#111111] font-black font-display flex items-center justify-center text-lg">
            {(user?.providerProfile?.businessName || user?.fullName || 'P').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-[#111111] truncate">
                {user?.providerProfile?.businessName || user?.fullName}
              </h3>
              <ShieldCheck className="w-4 h-4 text-[#65B32E]" />
            </div>
            <p className="text-xs text-[#4B5563] font-mono mt-0.5">{user?.phone}</p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#111111] border border-[#65B32E] text-[10px] font-bold mt-1.5">
              Active Mode: Provider Cockpit
            </span>
          </div>
        </div>

        {/* Switcher back to Customer Mode */}
        <div className="p-5 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#111111] text-xs font-bold">
              <Repeat className="w-4 h-4 text-[#65B32E]" />
              <span>Dual Role Switcher</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF8E7] border border-[#65B32E] font-bold text-[#111111]">
              Customer Mode
            </span>
          </div>

          <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
            Want to discover services or book an appointment as a customer? Switch instantly to Customer Mode.
          </p>

          <button
            onClick={() => switchRole('CUSTOMER')}
            className="w-full py-2.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Switch to Customer Mode</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-3xl border border-[#E8E4D9] divide-y divide-[#F2EFE8] overflow-hidden shadow-sm">
          <div
            onClick={onOpenServices}
            className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-3 text-[#111111] font-semibold">
              <Layers className="w-4 h-4 text-[#65B32E]" />
              <div>
                <span className="block font-bold">My Services & Menu</span>
                <span className="text-[10px] text-[#4B5563] font-normal">Add custom services, costs & view Admin approvals</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>

          <div
            onClick={onOpenKyc}
            className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-3 text-[#111111] font-semibold">
              <Briefcase className="w-4 h-4 text-[#65B32E]" />
              <span>KYC Verification & Banking Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>

          <div
            onClick={onOpenReviews}
            className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-3 text-[#111111] font-semibold">
              <Star className="w-4 h-4 text-[#65B32E]" />
              <span>Customer Reviews & Feedback</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>

          <div
            onClick={onOpenBranches}
            className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-3 text-[#111111] font-semibold">
              <Building2 className="w-4 h-4 text-[#65B32E]" />
              <span>Branch Locations</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>

          <div
            onClick={onOpenStaff}
            className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
          >
            <div className="flex items-center gap-3 text-[#111111] font-semibold">
              <Users className="w-4 h-4 text-[#65B32E]" />
              <span>Staff & Specialists</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>

        <div
          onClick={() => setShowLanguageModal(true)}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <Globe className="w-4 h-4 text-[#65B32E]" />
            <span>App Language</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#65B32E] px-2 py-0.5 rounded-full bg-[#EFF8E7]">
              {activeLangObj.nativeName} ({activeLangObj.name})
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>

        <div
          onClick={onOpenSupport}
          className="p-4 flex items-center justify-between hover:bg-[#FAF8F0] cursor-pointer transition-colors text-xs"
        >
          <div className="flex items-center gap-3 text-[#111111] font-semibold">
            <HelpCircle className="w-4 h-4 text-[#65B32E]" />
            <span>Provider Partner Support & Disputes</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>

        <div
          onClick={logout}
          className="p-4 flex items-center justify-between hover:bg-red-50 cursor-pointer transition-colors text-xs text-[#DC2626] font-bold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-[#DC2626]" />
            <span>Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </div>
      </div>
    </div>
  );
};
