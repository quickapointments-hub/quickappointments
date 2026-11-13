import React, { useState } from 'react';
import { Bell, ChevronDown, User, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  adminUser?: any;
  onNavigateToProfile?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  adminUser,
  onNavigateToProfile,
  onLogout,
  onToggleSidebar,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-30 font-sans">
      {/* Left: Hamburger menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right Controls: Notifications Bell & Admin User Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with Green Badge Dot */}
        <button
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-white" />
        </button>

        {/* Admin Avatar Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            {/* Circular Green Avatar with 'A' */}
            <div className="w-8 h-8 rounded-full bg-[#16A34A] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              A
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {adminUser?.fullName || 'Admin'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* User Profile Dropdown */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 font-sans"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{adminUser?.fullName || 'Admin'}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {adminUser?.email || 'admin@quickappointments.com'}
                </p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onNavigateToProfile?.();
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Profile</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout?.();
                }}
                className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
