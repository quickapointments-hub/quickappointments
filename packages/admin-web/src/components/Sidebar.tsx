import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  CalendarCheck2,
  Users2,
  FolderTree,
  Coins,
  FileClock,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingKycCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  pendingKycCount = 0,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    {
      id: 'verification',
      label: 'KYC & Verifications',
      icon: ShieldCheck,
      badge: pendingKycCount > 0 ? pendingKycCount : undefined,
    },
    { id: 'bookings', label: 'Appointments & Bookings', icon: CalendarCheck2 },
    { id: 'providers', label: 'Service Providers', icon: Users2 },
    { id: 'catalog', label: 'Categories & Catalog', icon: FolderTree },
    { id: 'finance', label: 'Commissions & Financials', icon: Coins },
    { id: 'audit', label: 'Compliance Audit Logs', icon: FileClock },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 min-h-screen flex flex-col shrink-0 select-none">
      {/* Brand Logo & Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Quick Appointments"
          className="h-10 w-auto object-contain"
        />
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            Admin Suite
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-1.5 flex-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Core Operations
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm ring-1 ring-brand-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-charcoal-900 text-brand-500 font-bold flex items-center justify-center text-xs">
              SA
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">SuperAdmin</p>
              <p className="text-[10px] text-slate-400">admin@quickappointments.com</p>
            </div>
          </div>
          <button
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

