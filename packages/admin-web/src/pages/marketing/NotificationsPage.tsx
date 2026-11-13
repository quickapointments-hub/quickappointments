import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Send,
  CheckCircle2,
  Users,
  Clock,
  Plus,
  Download,
  Search,
  Calendar,
  Eye,
  Copy,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  Smartphone,
} from 'lucide-react';

interface NotificationRecord {
  id: string;
  title: string;
  audience: 'Customers' | 'Service Providers' | 'All';
  messagePreview: string;
  scheduleSentAt: string;
  status: 'Sent' | 'Scheduled' | 'Draft';
  deliveredCount: number | null;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setNotifications(
        rows.map((r: any) => ({
          id: r.id,
          title: r.title || 'Notification',
          audience: r.audience === 'Customers' || r.audience === 'Service Providers' ? r.audience : 'All',
          messagePreview: r.message || '',
          scheduleSentAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Sent',
          status: 'Sent',
          deliveredCount: Number(r.recipientsCount ?? 1),
        }))
      );
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    return api.subscribeToSync((ev) => {
      if (ev === 'notifications_updated') loadNotifications();
    });
  }, [loadNotifications]);

  const [activeTab, setActiveTab] = useState<'All' | 'Sent' | 'Scheduled' | 'Drafts'>('All');
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationRecord | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAudience, setFormAudience] = useState<'Customers' | 'Service Providers' | 'All'>('Customers');
  const [formMessage, setFormMessage] = useState('');
  const [formSchedule, setFormSchedule] = useState('Immediate');

  // Dynamic calculations from actual notification records
  const totalNotifications = notifications.length;
  const sentNotifications = notifications.filter((n) => n.status === 'Sent');
  const deliveredCount = sentNotifications.reduce((acc, curr) => acc + (curr.deliveredCount || 0), 0);
  const scheduledCount = notifications.filter((n) => n.status === 'Scheduled').length;
  const draftsCount = notifications.filter((n) => n.status === 'Draft').length;
  const deliveryRate = totalNotifications > 0
    ? ((sentNotifications.length / totalNotifications) * 100).toFixed(1) + '%'
    : '0.0%';

  const filtered = notifications.filter((n) => {
    if (activeTab === 'Sent' && n.status !== 'Sent') return false;
    if (activeTab === 'Scheduled' && n.status !== 'Scheduled') return false;
    if (activeTab === 'Drafts' && n.status !== 'Draft') return false;
    if (audienceFilter !== 'All' && n.audience !== audienceFilter) return false;
    if (statusFilter !== 'All' && n.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.messagePreview.toLowerCase().includes(q);
  });

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleDuplicate = (n: NotificationRecord) => {
    setFormTitle(`${n.title} (Copy)`);
    setFormAudience(n.audience);
    setFormMessage(n.messagePreview);
    setShowCreateModal(true);
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) return;

    try {
      const res = await api.broadcastNotification({
        title: formTitle.trim(),
        message: formMessage.trim(),
        audience: formAudience,
      });
      const deliveredCount = res?.deliveredCount ?? 0;
      await loadNotifications();
      setShowCreateModal(false);
      setFormTitle('');
      setFormMessage('');
      alert(`Notification persisted & dispatched to ${deliveredCount} target account(s)!`);
    } catch (err: any) {
      alert(err?.message || 'Failed to broadcast notification');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Title & Top Right Actions matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notification Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, and manage push notifications to customers and service providers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv('Notification_Logs', notifications)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Notification</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Screenshot 3 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A] w-fit mb-2">
            <Send className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalNotifications.toLocaleString()}</div>
          <span className="text-xs font-semibold text-slate-500">Total Notifications</span>
        </div>

        <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 w-fit mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{deliveredCount.toLocaleString()}</div>
          <span className="text-xs font-semibold text-blue-700">Delivered</span>
        </div>

        <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-600 w-fit mb-2">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{deliveryRate}</div>
          <span className="text-xs font-semibold text-amber-700">Delivery Rate</span>
        </div>

        <div className="bg-[#FFF1F2] rounded-2xl p-5 border border-rose-100 shadow-sm">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 w-fit mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{scheduledCount}</div>
          <span className="text-xs font-semibold text-rose-700">Scheduled</span>
        </div>
      </div>

      {/* Pill Tabs matching Screenshot 3 */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'All'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Notifications ({totalNotifications.toLocaleString()})
        </button>

        <button
          onClick={() => setActiveTab('Sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Sent'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Sent ({sentNotifications.length.toLocaleString()})
        </button>

        <button
          onClick={() => setActiveTab('Scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Scheduled'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Scheduled ({scheduledCount})
        </button>

        <button
          onClick={() => setActiveTab('Drafts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Drafts'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Drafts ({draftsCount})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or message"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Audience</option>
            <option value="Customers">Customers</option>
            <option value="Service Providers">Service Providers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Status</option>
            <option value="Sent">Sent</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Draft">Draft</option>
          </select>

          <button
            onClick={() => alert('Select Date Range picker...')}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Date Range</span>
          </button>

          <button
            onClick={() => {
              setSearch('');
              setAudienceFilter('All');
              setStatusFilter('All');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Notifications Data Table matching Screenshot 3 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Notification Title</th>
                <th className="px-5 py-3.5">Audience</th>
                <th className="px-5 py-3.5">Message (Preview)</th>
                <th className="px-5 py-3.5">Schedule / Sent At</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Delivered</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No notifications found. Click &quot;+ Create Notification&quot; to dispatch push alerts to customers and service providers.
                  </td>
                </tr>
              ) : (
                filtered.map((n, idx) => (
                  <tr key={n.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-semibold">{idx + 1}</td>

                    {/* Title */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">{n.title}</td>

                    {/* Audience Badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          n.audience === 'Customers'
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {n.audience}
                      </span>
                    </td>

                    {/* Message Preview */}
                    <td className="px-5 py-3.5 max-w-xs text-slate-600 line-clamp-1">
                      {n.messagePreview}
                    </td>

                    {/* Schedule / Sent At */}
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {n.scheduleSentAt}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          n.status === 'Sent'
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : n.status === 'Scheduled'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {n.status}
                      </span>
                    </td>

                    {/* Delivered */}
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {n.deliveredCount !== null ? n.deliveredCount.toLocaleString() : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedNotif(n)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="View Broadcast"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(n)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {filtered.length === 0
              ? 'Showing 0 of 0 notifications'
              : `Showing 1 – ${filtered.length} of ${notifications.length} notifications`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={filtered.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white font-bold">1</button>
            <button
              disabled={filtered.length === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Broadcast Push Notification</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Notification Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Weekend Flash Sale – 20% OFF"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Target Audience
                </label>
                <select
                  value={formAudience}
                  onChange={(e: any) => setFormAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Customers">Customers (App Users)</option>
                  <option value="Service Providers">Service Providers</option>
                  <option value="All">All Registered Accounts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Enter the push notification message text..."
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Dispatch Schedule
                </label>
                <select
                  value={formSchedule}
                  onChange={(e) => setFormSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Immediate">Send Immediately (Instant Broadcast)</option>
                  <option value="Tomorrow, 09:00 AM">Tomorrow at 09:00 AM</option>
                  <option value="Weekend Special (Friday 06:00 PM)">Weekend Special (Friday 06:00 PM)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

