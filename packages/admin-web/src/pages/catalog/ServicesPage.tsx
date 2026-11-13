import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  X,
  Layers,
  Clock,
  IndianRupee,
  Download,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { exportToCsv } from '../../utils/exportCsv';

interface ServiceItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formBasePrice, setFormBasePrice] = useState<number | ''>('');
  const [formDuration, setFormDuration] = useState<number | ''>(60);
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('services-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res?.data) {
        setCategories(res.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (e) {
      console.warn('Load categories error:', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCategories();
      const res = await api.getServices();
      if (res?.data) {
        const mapped: ServiceItem[] = res.data.map((s: any) => ({
          id: s.id,
          categoryId: s.category_id,
          categoryName: s.category?.name || 'Uncategorized',
          name: s.name,
          slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
          description: s.description || '',
          durationMinutes: Number(s.duration_minutes) || 60,
          basePrice: Number(s.base_price) || 0,
          isActive: s.is_active !== false,
          createdAt: s.created_at || '',
        }));
        setServices(mapped);
      }
    } catch (e) {
      console.warn('Load services error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCategory === 'ALL' || s.categoryId === selectedCategory;
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCategory, search]);

  const handleOpenAddModal = () => {
    setEditingService(null);
    setFormName('');
    setFormCategoryId(categories[0]?.id || '');
    setFormBasePrice('');
    setFormDuration(60);
    setFormDescription('');
    setFormIsActive(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setFormName(service.name);
    setFormCategoryId(service.categoryId);
    setFormBasePrice(service.basePrice);
    setFormDuration(service.durationMinutes);
    setFormDescription(service.description);
    setFormIsActive(service.isActive);
    setShowModal(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (togglingId) return;
    const targetStatus = !currentActive;

    try {
      setTogglingId(id);
      const res = await api.updateService(id, { is_active: targetStatus });
      if (res?.success && res.data) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isActive: res.data.is_active } : s))
        );
      } else {
        throw new Error('Database did not confirm the service status change.');
      }
    } catch (err: any) {
      alert(`Failed to update service status: ${err.message}`);
      await loadData();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete service "${name}" from the database?`)) {
      try {
        await api.deleteService(id);
        setServices((prev) => prev.filter((s) => s.id !== id));
      } catch (err: any) {
        alert(`Failed to delete service: ${err.message}`);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a service name.');
      return;
    }
    if (!formCategoryId) {
      alert('Please select a parent category for this service.');
      return;
    }
    if (formBasePrice === '' || Number(formBasePrice) < 0) {
      alert('Please enter a valid base price.');
      return;
    }

    try {
      setSaving(true);
      if (editingService) {
        await api.updateService(editingService.id, {
          name: formName.trim(),
          category_id: formCategoryId,
          base_price: Number(formBasePrice),
          duration_minutes: Number(formDuration) || 60,
          description: formDescription.trim(),
          is_active: formIsActive,
        });
      } else {
        await api.createService({
          name: formName.trim(),
          categoryId: formCategoryId,
          basePrice: Number(formBasePrice),
          durationMinutes: Number(formDuration) || 60,
          description: formDescription.trim(),
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Failed to save service: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      'quick_appointments_services.csv',
      filteredServices.map((s) => ({
        'Service ID': s.id,
        'Service Name': s.name,
        'Parent Category': s.categoryName,
        'Base Price (INR)': s.basePrice,
        'Duration (Minutes)': s.durationMinutes,
        'Active Status': s.isActive ? 'Active' : 'Inactive',
        Description: s.description,
      }))
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Services Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage individual offerings associated under each parent category.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={filteredServices.length === 0}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services by name, category, or description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#16A34A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#16A34A] bg-white cursor-pointer"
          >
            <option value="ALL">All Categories ({services.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Table or Empty State */}
      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400 font-medium">
          Loading live database services...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Services Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {categories.length === 0
              ? 'Please create at least one parent category first in Category Management before adding services.'
              : 'No services match your active filters. Click "+ Add Service" to add a new service.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Service Details</th>
                  <th className="py-3.5 px-6">Parent Category</th>
                  <th className="py-3.5 px-6">Base Price</th>
                  <th className="py-3.5 px-6">Duration</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">{service.name}</div>
                      {service.description && (
                        <div className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                          {service.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20 inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {service.categoryName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-900 flex items-center gap-0.5">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        {service.basePrice.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-600 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {service.durationMinutes} mins
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        disabled={togglingId === service.id}
                        onClick={() => handleToggleActive(service.id, service.isActive)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          service.isActive ? 'bg-[#16A34A]' : 'bg-slate-300'
                        } ${togglingId === service.id ? 'opacity-50 cursor-wait' : ''}`}
                        title={
                          togglingId === service.id
                            ? 'Updating status...'
                            : service.isActive
                            ? 'Click to deactivate'
                            : 'Click to activate'
                        }
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            service.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Haircut, Kitchen Deep Cleaning, AC Repair"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A] bg-white cursor-pointer"
                >
                  <option value="" disabled>
                    Select parent category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Each service must belong to an overarching platform category.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formBasePrice}
                    onChange={(e) =>
                      setFormBasePrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="e.g. 499"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Standard Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formDuration}
                    onChange={(e) =>
                      setFormDuration(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="e.g. 60"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Service Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed description of what is included in this service..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-slate-700">Service Active Status</span>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    formIsActive ? 'bg-[#16A34A]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                      formIsActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingService
                    ? 'Update Service'
                    : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

