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
  Tag,
  Users,
  RotateCcw,
  Landmark,
  HelpCircle,
  UserCog,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

interface MenuSection {
  title: string;
  roles: string[];
  items: MenuItem[];
}

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
  adminUser,
}) => {
  const userRole = adminUser?.activeRole || 'SUPERADMIN';

  const menuSections: MenuSection[] = [
    {
      title: 'Overview',
      roles: ['SUPERADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'],
      items: [{ id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'Verification',
      roles: ['SUPERADMIN', 'OPERATIONS_ADMIN'],
      items: [
        {
          id: 'verification',
          label: 'KYC & Verifications',
          icon: ShieldCheck,
          badge: pendingKycCount > 0 ? pendingKycCount : undefined,
        },
      ],
    },
    {
      title: 'Catalog Curation',
      roles: ['SUPERADMIN', 'OPERATIONS_ADMIN'],
      items: [
        { id: 'catalog', label: 'Master Categories', icon: FolderTree },
        { id: 'rate_cards', label: 'Rate Approvals', icon: Tag },
      ],
    },
    {
      title: 'Operations',
      roles: ['SUPERADMIN', 'OPERATIONS_ADMIN', 'SUPPORT_ADMIN'],
      items: [
        { id: 'bookings', label: 'Master Bookings', icon: CalendarCheck2 },
        { id: 'providers', label: 'Service Providers', icon: Users2 },
        { id: 'customers', label: 'Customer Accounts', icon: Users },
      ],
    },
    {
      title: 'Finance & Payouts',
      roles: ['SUPERADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'],
      items: [
        { id: 'finance', label: '5% Take-Rate Engine', icon: Coins },
        { id: 'refunds', label: '48h Refund Queue', icon: RotateCcw },
        { id: 'payouts', label: 'T+1 Settlements', icon: Landmark },
      ],
    },
    {
      title: 'Governance',
      roles: ['SUPERADMIN', 'SUPPORT_ADMIN'],
      items: [
        { id: 'support', label: 'Disputes & Tickets', icon: HelpCircle },
        { id: 'audit', label: 'Compliance Audit Logs', icon: FileClock },
        { id: 'roles', label: 'Admin RBAC Roles', icon: UserCog },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 min-h-screen flex flex-col shrink-0 select-none">
      {/* Brand Logo & Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <img src="/logo.png" alt="Quick Appointments" className="h-10 w-auto object-contain" />
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            {userRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="p-4 space-y-4 flex-1 overflow-y-auto">
        {menuSections.map((section) => {
          // Check role permission
          if (userRole !== 'SUPERADMIN' && !section.roles.includes(userRole)) {
            return null;
          }

          return (
            <div key={section.title} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-800 font-bold shadow-sm ring-1 ring-brand-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-brand-600' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-charcoal-900 text-brand-500 font-bold flex items-center justify-center text-xs shrink-0">
              {adminUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {adminUser?.fullName || 'SuperAdmin'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {adminUser?.email || 'admin@quickappointments.in'}
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
