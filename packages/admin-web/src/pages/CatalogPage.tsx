import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { FolderTree, Plus, Sparkles, Clock, Tag } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [catRes, servRes] = await Promise.all([
        api.getCategories(),
        api.getServices(),
      ]);
      setCategories(catRes.data || []);
      setServices(servRes.data || []);
      if (catRes.data?.length > 0 && !selectedCatId) {
        setSelectedCatId(catRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories.find((c) => c.id === selectedCatId);
  const filteredServices = services.filter((s) => !selectedCatId || s.categoryId === selectedCatId);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-brand-600" />
            <span>Dynamic Category & Service Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Admin-controlled service taxonomy. Category definitions and base prices synchronize live across Mobile & Web.
          </p>
        </div>
      </div>

      {/* 4 Launch Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((c) => {
          const isSelected = selectedCatId === c.id;
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-charcoal-900 text-brand-400 font-bold flex items-center justify-center text-xs">
                  0{c.displayOrder}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {c._count?.services || 3} Services
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{c.description}</p>
            </div>
          );
        })}
      </div>

      {/* Services in Selected Category */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <span>Services in</span>
              <span className="text-brand-600">"{currentCategory?.name || 'All Categories'}"</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Base catalog pricing, duration specifications & service descriptions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-2xl border border-slate-200/90 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{service.durationMinutes} mins</span>
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">{service.name}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{service.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Base Price</span>
                  <p className="text-base font-bold font-display text-slate-900">₹{service.basePrice}</p>
                </div>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-xl">
                  Bookable Live
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

