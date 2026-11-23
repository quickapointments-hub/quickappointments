import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  Menu,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  Inbox,
  X,
  Calendar,
  Briefcase,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';
import { api } from '../api';
import { supabase } from '../supabase';

export interface AdminNotificationItem {
  id: string;
  type: 'PROVIDER' | 'CUSTOMER';
  category: 'KYC' | 'RATE_CARD' | 'BOOKING' | 'REFUND' | 'SUPPORT' | 'PAYOUT';
  title: string;
  summary: string;
  targetTab: string;
  actionLabel: string;
  timestamp: string;
  priority: 'HIGH' | 'NORMAL';
  badge?: string;
  isRead?: boolean;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  adminUser?: any;
  onNavigateToProfile?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const DEFAULT_FALLBACK_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: 'mock-kyc-1',
    type: 'PROVIDER',
    category: 'KYC',
    title: 'KYC Review: Elite Health Diagnostics (Clinic)',
    summary: 'Clinical Establishment License, GST certificate, and Doctor Registration uploaded. Awaiting Admin clearance.',
    targetTab: 'verification',
    actionLabel: 'Review Documents',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    badge: 'Pending KYC',
  },
  {
    id: 'mock-refund-1',
    type: 'CUSTOMER',
    category: 'REFUND',
    title: '100% Refund Request: Booking #BK-9021',
    summary: 'Customer cancelled Hair Styling appointment 6 hours before slot. Guaranteed 100% refund SLA requires gateway dispatch.',
    targetTab: 'refunds',
    actionLabel: 'Process Refund',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    priority: 'HIGH',
    badge: '48h SLA',
  },
  {
    id: 'mock-rate-1',
    type: 'PROVIDER',
    category: 'RATE_CARD',
    title: 'Custom Rate Proposal: Urban Glam Salon & Spa',
    summary: 'Submitted custom menu: "Bridal Glow Styling & Facial" at ₹2,499. Admin approval required before public listing.',
    targetTab: 'rate_cards',
    actionLabel: 'Approve Rates',
    timestamp: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    badge: 'Rate Card',
  },
  {
    id: 'mock-booking-1',
    type: 'CUSTOMER',
    category: 'BOOKING',
    title: 'New Customer Request: Dental Consultation',
    summary: 'Priya Sharma booked premium dental consultation slot for tomorrow 10:00 AM at SmileCare Clinic.',
    targetTab: 'bookings',
    actionLabel: 'View Booking',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    badge: 'New Booking',
  },
  {
    id: 'mock-ticket-1',
    type: 'PROVIDER',
    category: 'SUPPORT',
    title: 'Provider Requirement: Bank Account Update Request',
    summary: 'Apex Academy requested bank IFSC code update for weekly direct-deposit settlement.',
    targetTab: 'support',
    actionLabel: 'Open Ticket',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    badge: 'Partner Desk',
  },
  {
    id: 'mock-ticket-2',
    type: 'CUSTOMER',
    category: 'SUPPORT',
    title: 'Customer Requirement: Wheelchair Accessibility Query',
    summary: 'Amit Patil requested wheelchair accessibility details for scheduled appointment at Apex Medical Center.',
    targetTab: 'support',
    actionLabel: 'Open Ticket',
    timestamp: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
    priority: 'NORMAL',
    badge: 'Customer Desk',
  },
];

function formatTimeAgo(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

export const Header: React.FC<HeaderProps> = ({
  adminUser,
  onNavigateToProfile,
  onLogout,
  onToggleSidebar,
  onNavigateTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PROVIDER' | 'CUSTOMER'>('ALL');
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('qa_admin_read_notifs');
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const popoverRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Load real-time requests & requirements
  const loadNotificationsFeed = async () => {
    try {
      const res = await api.getAdminRequestsFeed();
      if (res?.data?.notifications && Array.isArray(res.data.notifications) && res.data.notifications.length > 0) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications(DEFAULT_FALLBACK_NOTIFICATIONS);
      }
    } catch {
      // Fallback seamlessly to default items
      setNotifications(DEFAULT_FALLBACK_NOTIFICATIONS);
    }
  };

  useEffect(() => {
    loadNotificationsFeed();

    // Listen to real-time events across the platform
    const unsub = api.subscribeToSync((event) => {
      if (
        event === 'providers_updated' ||
        event === 'bookings_updated' ||
        event === 'rates_updated' ||
        event === 'refunds_updated' ||
        event === 'notifications_updated'
      ) {
        loadNotificationsFeed();
      }
    });

    // Supabase real-time changes
    const channel = supabase
      .channel('admin-header-requests-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadNotificationsFeed();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        loadNotificationsFeed();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_service_rates' }, () => {
        loadNotificationsFeed();
      })
      .subscribe();

    const interval = setInterval(loadNotificationsFeed, 30000);

    return () => {
      unsub();
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const persistReadIds = (newSet: Set<string>) => {
    setReadIds(newSet);
    try {
      localStorage.setItem('qa_admin_read_notifs', JSON.stringify(Array.from(newSet)));
    } catch {}
  };

  const handleMarkAllRead = () => {
    const nextSet = new Set(readIds);
    notifications.forEach((n) => nextSet.add(n.id));
    persistReadIds(nextSet);
  };

  const handleSelectNotification = (item: AdminNotificationItem) => {
    const nextSet = new Set(readIds);
    nextSet.add(item.id);
    persistReadIds(nextSet);
    setNotificationsOpen(false);
    if (onNavigateTab && item.targetTab) {
      onNavigateTab(item.targetTab);
    }
  };

  // Filtered list
  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.type === filterTab;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const unreadProviders = notifications.filter((n) => n.type === 'PROVIDER' && !readIds.has(n.id)).length;
  const unreadCustomers = notifications.filter((n) => n.type === 'CUSTOMER' && !readIds.has(n.id)).length;

  const getCategoryIcon = (category: AdminNotificationItem['category'], type: 'PROVIDER' | 'CUSTOMER') => {
    switch (category) {
      case 'KYC':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'RATE_CARD':
        return <Tag className="w-4 h-4 text-indigo-600" />;
      case 'REFUND':
        return <RotateCcw className="w-4 h-4 text-rose-600" />;
      case 'BOOKING':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'SUPPORT':
        return <LifeBuoy className="w-4 h-4 text-amber-600" />;
      case 'PAYOUT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return type === 'PROVIDER' ? (
          <Briefcase className="w-4 h-4 text-emerald-600" />
        ) : (
          <User className="w-4 h-4 text-blue-600" />
        );
    }
  };

  const getCategoryBg = (category: AdminNotificationItem['category']) => {
    switch (category) {
      case 'KYC':
        return 'bg-emerald-50 border-emerald-200';
      case 'RATE_CARD':
        return 'bg-indigo-50 border-indigo-200';
      case 'REFUND':
        return 'bg-rose-50 border-rose-200';
      case 'BOOKING':
        return 'bg-blue-50 border-blue-200';
      case 'SUPPORT':
        return 'bg-amber-50 border-amber-200';
      case 'PAYOUT':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

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
        {/* Notification Bell with Dynamic Unread Counter Badge */}
        <div className="relative">
          <button
            ref={bellButtonRef}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative p-2.5 rounded-xl transition-all ${
              notificationsOpen
                ? 'bg-emerald-50 text-[#16A34A] ring-2 ring-[#16A34A]/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Customer & Provider Requests & Requirements"
            aria-label="Customer & Provider Requests & Requirements"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[20px] h-5 rounded-full bg-[#16A34A] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-white" />
            )}
          </button>

          {/* Customer & Provider Requests Popover Dropdown */}
          {notificationsOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 mt-3 w-[420px] sm:w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-sm">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-white">Requests & Requirements</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[10px] font-bold shadow-sm">
                          {unreadCount} Pending
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">Customer & Provider real-time operational desk</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="px-3 pt-2.5 pb-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5">
                <button
                  onClick={() => setFilterTab('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    filterTab === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>All</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {notifications.length}
                  </span>
                </button>

                <button
                  onClick={() => setFilterTab('PROVIDER')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    filterTab === 'PROVIDER'
                      ? 'bg-white text-[#16A34A] shadow-sm border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Provider Requests</span>
                  {unreadProviders > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {unreadProviders}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={() => setFilterTab('CUSTOMER')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    filterTab === 'CUSTOMER'
                      ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Requests</span>
                  {unreadCustomers > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {unreadCustomers}
                    </span>
                  ) : null}
                </button>
              </div>

              {/* Notification Items List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="py-12 px-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      No pending requests or requirements under this filter. Everything is operating smoothly.
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((item) => {
                    const isRead = readIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectNotification(item)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                          !isRead ? 'bg-emerald-50/20' : 'bg-white'
                        }`}
                      >
                        {/* Left Icon Badge */}
                        <div
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${getCategoryBg(
                            item.category
                          )}`}
                        >
                          {getCategoryIcon(item.category, item.type)}
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {/* Role Badge */}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.type === 'PROVIDER'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {item.type === 'PROVIDER' ? 'Provider' : 'Customer'}
                            </span>

                            {/* Category Tag */}
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                {item.badge}
                              </span>
                            )}

                            {/* Priority */}
                            {item.priority === 'HIGH' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Urgent</span>
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400 ml-auto flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(item.timestamp)}</span>
                            </span>
                          </div>

                          <h4
                            className={`text-xs font-bold leading-snug line-clamp-1 ${
                              !isRead ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                            }`}
                          >
                            {item.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.summary}
                          </p>

                          {/* Quick Action Link */}
                          <div className="mt-2 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] group-hover:text-emerald-700 transition-colors">
                              <span>{item.actionLabel}</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>

                            {!isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#16A34A] ring-2 ring-emerald-100" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick-Access Action Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Desks:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.('verification');
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#16A34A] transition-colors"
                  >
                    KYC
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.('rate_cards');
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#16A34A] transition-colors"
                  >
                    Rate Cards
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.('refunds');
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#16A34A] transition-colors"
                  >
                    Refunds
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      onNavigateTab?.('support');
                    }}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[#16A34A] transition-colors"
                  >
                    Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

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
              {adminUser?.fullName || 'Super Administrator'}
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
                <p className="text-xs font-bold text-slate-800">{adminUser?.fullName || 'Super Administrator'}</p>
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
