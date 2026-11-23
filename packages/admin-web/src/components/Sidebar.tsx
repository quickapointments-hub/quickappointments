import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderTree,
  Wrench,
  Tag,
  CalendarCheck,
  MapPin,
  CreditCard,
  Ticket,
  Image as ImageIcon,
  Bell,
  Star,
  Headphones,
  BarChart3,
  Users2,
  Settings,
  UserCheck,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  pendingKycCount?: number;
  adminUser?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  pendingKycCount = 0,
}) => {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'providers', label: 'Service Providers', icon: Briefcase, badge: pendingKycCount > 0 ? pendingKycCount : undefined },
    { id: 'catalog', label: 'Categories', icon: FolderTree },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'rate_cards', label: 'Rate Cards', icon: Tag },
    { id: 'bookings', label: 'Appointments', icon: CalendarCheck },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'finance', label: 'Finance & Payments', icon: CreditCard },
    { id: 'offers', label: 'Offers & Coupons', icon: Ticket },
    { id: 'banners', label: 'Banner Management', icon: ImageIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'support', label: 'Support & Complaints', icon: Headphones },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'roles', label: 'Admin User Management', icon: Users2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen font-sans select-none overflow-y-auto">
      {/* Brand Header */}
      <div>
        <div className="h-20 px-6 flex items-center border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Quick Appointments"
              className="h-10 w-auto object-contain"
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
                QUICK
              </span>
              <span className="font-semibold text-[10px] tracking-wider text-[#16A34A] -mt-0.5">
                APPOINTMENTS
              </span>
            </div>
          </div>
        </div>

        {/* Primary Menu Navigation */}
        <div className="px-3 py-4 space-y-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentTab === item.id ||
              (item.id === 'providers' && currentTab === 'provider_details');
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#16A34A] text-white shadow-sm shadow-emerald-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                      isActive ? 'bg-white text-[#16A34A]' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Logout Group */}
      <div className="p-3 border-t border-slate-100 space-y-1 bg-white sticky bottom-0 z-10">
        <button
          onClick={() => onTabChange('admin_profile')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'admin_profile'
              ? 'bg-[#16A34A] text-white shadow-sm shadow-emerald-700/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCheck
            className={`w-4 h-4 shrink-0 ${
              currentTab === 'admin_profile' ? 'text-white' : 'text-slate-400'
            }`}
          />
          <span>Admin Profile</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
