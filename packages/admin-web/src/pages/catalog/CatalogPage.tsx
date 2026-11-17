import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  servicesCount: number;
  isActive: boolean;
  displayOrder: number;
}

interface CatalogPageProps {
  onNavigateToRateCards?: () => void;
  onNavigateToServices?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onNavigateToRateCards,
  onNavigateToServices,
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadLiveCategories();

    const channel = supabase
      .channel('categories-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadLiveCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLiveCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      if (res?.data) {
        const mapped: CategoryItem[] = res.data.map((c: any, idx: number) => ({
          id: c.id,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          description: c.description || '',
          servicesCount: Array.isArray(c.services) ? c.services.length : 0,
          isActive: c.is_active !== false,
          displayOrder: c.display_order || idx + 1,
        }));
        setCategories(mapped);
      }
    } catch (e) {
      console.warn('Error loading categories from database:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryActive = async (id: string, currentActive: boolean) => {
    if (togglingId) return;
    const targetStatus = !currentActive;

    try {
      setTogglingId(id);
      // Immediately send the correct update request to Supabase
      const res = await api.updateCategory(id, { is_active: targetStatus });

      // Confirm the database update succeeded
      if (res?.success && res.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: res.data.is_active } : c))
        );
      } else {
        throw new Error('Database response did not confirm the status change.');
      }
    } catch (err: any) {
      console.error('Toggle category active failed:', err);
      alert(
        `Failed to update category status: ${err.message || 'Database error occurred. The previous status has been restored.'
        }`
      );
      // Restore previous state from live database
      await loadLiveCategories();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Are you sure you want to delete this category from the database?')) {
      try {
        await api.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        alert(`Failed to delete category: ${err.message}`);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: newCatName.trim(),
          description: newCatDescription.trim(),
        });
        setEditingCategory(null);
      } else {
        await api.createCategory({
          name: newCatName.trim(),
          description: newCatDescription.trim(),
          display_order: categories.length + 1,
        });
      }
      setShowAddModal(false);
      setNewCatName('');
      setNewCatDescription('');
      await loadLiveCategories();
    } catch (err: any) {
      alert(`Failed to save category: ${err.message}`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage main service categories displayed on the customer mobile app home screen.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null);
            setNewCatName('');
            setNewCatDescription('');
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Sub-navigation Tabs: Categories | Catalog Services | Swiggy Rate Cards */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60 text-xs font-bold">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-white text-slate-900 shadow-xs cursor-default flex items-center gap-2"
        >
          <Layers className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Categories Directory</span>
        </button>
        {onNavigateToServices && (
          <button
            type="button"
            onClick={onNavigateToServices}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors cursor-pointer"
          >
            Standard Services
          </button>
        )}
        {onNavigateToRateCards && (
          <button
            type="button"
            onClick={onNavigateToRateCards}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-[#16A34A] hover:bg-white/60 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Provider Menu Approvals (Swiggy Flow)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </button>
        )}
      </div>

      {/* Grid of Category Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium">
          Loading live database categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
          No categories found in database. Click "+ Add Category" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xs ${cat.isActive ? 'border-slate-200/80' : 'border-slate-200 opacity-60'
                }`}
            >
              <div>
                {/* Top Bar of Card */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-slate-300 hover:text-slate-500 cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {cat.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Category Header Badge */}
                <div className="w-10 h-10 rounded-2xl bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center font-black text-sm mb-3 border border-[#16A34A]/20">
                  <Layers className="w-5 h-5 text-[#16A34A]" />
                </div>

                {/* Name & Count */}
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{cat.description}</p>
                  )}
                  <span className="text-xs text-[#16A34A] font-semibold mt-1.5 inline-block bg-[#EFF8E7] px-2 py-0.5 rounded-lg">
                    {cat.servicesCount} {cat.servicesCount === 1 ? 'Service' : 'Services'}
                  </span>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Active in App</span>
                  <button
                    type="button"
                    disabled={togglingId === cat.id}
                    onClick={() => toggleCategoryActive(cat.id, cat.isActive)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${cat.isActive ? 'bg-[#16A34A]' : 'bg-slate-300'
                      } ${togglingId === cat.id ? 'opacity-50 cursor-wait' : ''}`}
                    title={
                      togglingId === cat.id
                        ? 'Updating database status...'
                        : cat.isActive
                          ? 'Click to deactivate in app'
                          : 'Click to activate in app'
                    }
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${cat.isActive ? 'translate-x-5' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setNewCatName(cat.name);
                      setNewCatDescription(cat.description || '');
                      setShowAddModal(true);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal without Icon selection */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Salon & Haircare"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Brief description of the service category"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold cursor-pointer shadow-xs"
                >
                  {editingCategory ? 'Update Category' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
