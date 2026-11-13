import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Image as ImageIcon,
  Plus,
  Download,
  Search,
  Calendar,
  Play,
  Pause,
  Clock,
  Edit2,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface BannerItem {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  badge: string;
  bgGradient: string;
  linkType: 'Service' | 'Offer' | 'Coupon';
  location: string;
  schedule: string;
  status: 'Active' | 'Scheduled' | 'Inactive';
}

export const BannersPage: React.FC = () => {
  const defaultBanners: BannerItem[] = [
    {
      id: 'b1',
      order: 1,
      title: 'Spa & Salon at Home',
      subtitle: 'Relax & Rejuvenate - Book Spa & Salon Services',
      badge: 'Up to 30% OFF',
      bgGradient: 'from-emerald-100 to-teal-50',
      linkType: 'Service',
      location: 'All Locations',
      schedule: '01 Nov 2026 – 30 Nov 2026',
      status: 'Active',
    },
    {
      id: 'b2',
      order: 2,
      title: 'Home Cleaning Offer',
      subtitle: 'Home Cleaning Services - Book Professional Experts',
      badge: 'Flat ₹200 OFF',
      bgGradient: 'from-blue-100 to-indigo-50',
      linkType: 'Offer',
      location: 'All Locations',
      schedule: '01 Nov 2026 – 30 Nov 2026',
      status: 'Active',
    },
    {
      id: 'b3',
      order: 3,
      title: 'AC Service & Repair',
      subtitle: 'AC Service & Repair At Your Doorstep',
      badge: 'Starts ₹399',
      bgGradient: 'from-sky-100 to-cyan-50',
      linkType: 'Service',
      location: 'Hyderabad',
      schedule: '05 Nov 2026 – 30 Nov 2026',
      status: 'Active',
    },
    {
      id: 'b4',
      order: 4,
      title: 'Beauty Offers',
      subtitle: 'Salon & Beauty Special Offers',
      badge: 'Up to 20% OFF',
      bgGradient: 'from-rose-100 to-pink-50',
      linkType: 'Offer',
      location: 'All Locations',
      schedule: '01 Nov 2026 – 15 Nov 2026',
      status: 'Scheduled',
    },
    {
      id: 'b5',
      order: 5,
      title: 'New User Offer',
      subtitle: 'New User Welcome Offer - Flat ₹100 OFF',
      badge: 'Code: FIRST100',
      bgGradient: 'from-amber-100 to-orange-50',
      linkType: 'Coupon',
      location: 'All Locations',
      schedule: '—',
      status: 'Inactive',
    },
  ];

  const [banners, setBanners] = useState<BannerItem[]>([]);

  const loadBanners = useCallback(async () => {
    try {
      const res = await api.getBanners();
      const rows = Array.isArray(res?.data) ? res.data : [];
      const mapped: BannerItem[] = rows.map((r: any, idx: number) => ({
        id: r.id,
        order: Number(r.display_order ?? r.displayOrder ?? idx + 1),
        title: r.title || 'Promotional Banner',
        subtitle: r.subtitle || '',
        badge: r.cta_text || r.ctaText || 'Book Now',
        bgGradient: 'from-emerald-100 to-teal-50',
        linkType: 'Service',
        location: r.city || 'All Cities',
        schedule: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active',
        status: r.is_active === false ? 'Inactive' : 'Active',
      }));
      setBanners(mapped);
    } catch (err) {
      console.error('Failed to load banners:', err);
    }
  }, []);

  useEffect(() => {
    loadBanners();
    return api.subscribeToSync((ev) => {
      if (ev === 'banners_updated') loadBanners();
    });
  }, [loadBanners]);

  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Scheduled' | 'Inactive'>('All');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  // Add/Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formLinkType, setFormLinkType] = useState<'Service' | 'Offer' | 'Coupon'>('Service');
  const [formLocation, setFormLocation] = useState('All Locations');
  const [formStatus, setFormStatus] = useState<'Active' | 'Scheduled' | 'Inactive'>('Active');
  const [formSchedule, setFormSchedule] = useState('01 Nov 2026 – 30 Nov 2026');

  // Stats
  const totalCount = banners.length;
  const activeCount = banners.filter((b) => b.status === 'Active').length;
  const scheduledCount = banners.filter((b) => b.status === 'Scheduled').length;
  const inactiveCount = banners.filter((b) => b.status === 'Inactive').length;

  const filtered = banners.filter((b) => {
    if (activeTab !== 'All' && b.status !== activeTab) return false;
    if (statusFilter !== 'All' && b.status !== statusFilter) return false;
    if (locationFilter !== 'All' && b.location !== locationFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.subtitle.toLowerCase().includes(q);
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this promotional banner?')) {
      try {
        await api.deleteBanner(id);
        await loadBanners();
      } catch (err: any) {
        alert(err?.message || 'Failed to delete banner');
      }
    }
  };

  const handleDuplicate = async (b: BannerItem) => {
    try {
      await api.createBanner({
        title: `${b.title} (Copy)`,
        subtitle: b.subtitle,
        ctaText: b.badge,
        city: b.location,
        displayOrder: banners.length + 1,
        isActive: false,
      });
      await loadBanners();
    } catch (err: any) {
      alert(err?.message || 'Failed to duplicate banner');
    }
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormBadge('');
    setFormLinkType('Service');
    setFormLocation('All Locations');
    setFormStatus('Active');
    setFormSchedule('01 Nov 2026 – 30 Nov 2026');
    setShowAddModal(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setFormTitle(b.title);
    setFormSubtitle(b.subtitle);
    setFormBadge(b.badge);
    setFormLinkType(b.linkType);
    setFormLocation(b.location);
    setFormStatus(b.status);
    setFormSchedule(b.schedule);
    setShowAddModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (editingBanner) {
        await api.updateBanner(editingBanner.id, {
          title: formTitle.trim(),
          subtitle: (formSubtitle || formTitle).trim(),
          ctaText: formBadge || 'Book Now',
          city: formLocation || 'All Cities',
          isActive: formStatus !== 'Inactive',
        });
      } else {
        await api.createBanner({
          title: formTitle.trim(),
          subtitle: (formSubtitle || formTitle).trim(),
          ctaText: formBadge || 'Book Now',
          city: formLocation || 'All Cities',
          displayOrder: banners.length + 1,
          isActive: formStatus !== 'Inactive',
        });
      }
      await loadBanners();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save banner');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Title & Top-Right Actions matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Banner Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, schedule, and manage home screen banners for the customer app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv('Banners_List', banners)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Banner</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Screenshot 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A] w-fit mb-2">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
          <span className="text-xs font-semibold text-slate-500">Total Banners</span>
        </div>

        <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 w-fit mb-2">
            <Play className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{activeCount}</div>
          <span className="text-xs font-semibold text-blue-700">Active Banners</span>
        </div>

        <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-600 w-fit mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{scheduledCount}</div>
          <span className="text-xs font-semibold text-amber-700">Scheduled</span>
        </div>

        <div className="bg-[#FFF1F2] rounded-2xl p-5 border border-rose-100 shadow-sm">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 w-fit mb-2">
            <Pause className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{inactiveCount}</div>
          <span className="text-xs font-semibold text-rose-700">Inactive</span>
        </div>
      </div>

      {/* Pill Tabs matching Screenshot 1 */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'All'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Banners ({totalCount})
        </button>

        <button
          onClick={() => setActiveTab('Active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Active'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active ({activeCount})
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
          onClick={() => setActiveTab('Inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Inactive'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Inactive ({inactiveCount})
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
            placeholder="Search by banner title"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Locations</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Warangal">Warangal</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setLocationFilter('All');
              setStatusFilter('All');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Banners Data Table matching Screenshot 1 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Banner Preview</th>
                <th className="px-5 py-3.5">Banner Title</th>
                <th className="px-5 py-3.5">Link To</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Schedule</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((b, idx) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-slate-400 font-semibold">{idx + 1}</td>

                  {/* Banner Graphic Card Preview */}
                  <td className="px-5 py-3.5">
                    <div
                      className={`w-44 h-16 rounded-xl bg-gradient-to-r ${b.bgGradient} p-2 flex flex-col justify-between border border-slate-200/60 shadow-xs relative overflow-hidden`}
                    >
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-900 block truncate">
                          {b.title}
                        </span>
                        <span className="text-[8px] text-slate-600 block line-clamp-1">
                          {b.subtitle}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold text-[#16A34A] bg-white/80 px-1.5 py-0.5 rounded w-fit">
                        {b.badge}
                      </span>
                    </div>
                  </td>

                  {/* Banner Title */}
                  <td className="px-5 py-3.5 font-bold text-slate-900">{b.title}</td>

                  {/* Link To Tag */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        b.linkType === 'Service'
                          ? 'bg-emerald-100 text-[#16A34A]'
                          : b.linkType === 'Offer'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {b.linkType}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-3.5 text-slate-600 font-medium">{b.location}</td>

                  {/* Schedule */}
                  <td className="px-5 py-3.5 text-slate-600 text-[11px]">
                    {b.schedule !== '—' ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {b.schedule}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'Active'
                          ? 'bg-emerald-50 text-[#16A34A]'
                          : b.status === 'Scheduled'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination matching Screenshot 1 */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 – {filtered.length} of {totalCount} banners</span>
          <div className="flex items-center gap-1.5">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[#16A34A] text-white font-bold">1</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">2</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">3</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Banner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingBanner ? 'Edit Home Screen Banner' : 'Add New Home Screen Banner'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Banner Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Spa & Salon at Home"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Promotional Tag / Badge
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="e.g. Flat ₹150 OFF, Starts ₹299"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Link Destination
                  </label>
                  <select
                    value={formLinkType}
                    onChange={(e: any) => setFormLinkType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Service">Service</option>
                    <option value="Offer">Offer</option>
                    <option value="Coupon">Coupon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Target Location
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="All Locations">All Locations</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Warangal">Warangal</option>
                    <option value="Bengaluru">Bengaluru</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Schedule Range
                  </label>
                  <input
                    type="text"
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value)}
                    placeholder="01 Nov 2026 – 30 Nov 2026"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Banner Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  {editingBanner ? 'Save Changes' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

