import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import { exportToCsv } from '../../utils/exportCsv';
import {
  MapPin,
  Map,
  CheckCircle2,
  Plus,
  Download,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface CityItem {
  id: string;
  name: string;
  state: string;
  is_active: boolean;
}

export const ServiceLocationsPage: React.FC = () => {
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('Telangana');

  useEffect(() => {
    loadCities();

    const channel = supabase
      .channel('cities-page-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
        loadCities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      const res = await api.getServiceCities();
      if (res?.data) {
        setCities(res.data);
      }
    } catch (e) {
      console.warn('Error loading cities from database:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalCities = cities.length;
  const activeCount = cities.filter((c) => c.is_active !== false).length;
  const inactiveCount = cities.filter((c) => c.is_active === false).length;

  const handleToggleCity = async (id: string, currentActive: boolean) => {
    try {
      await api.toggleCityStatus(id, !currentActive);
      setCities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !currentActive } : c))
      );
    } catch (err: any) {
      alert(`Failed to update city status: ${err.message}`);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm('Are you sure you want to remove this city coverage from database?')) {
      try {
        await api.deleteServiceCity(id);
        setCities((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        alert(`Failed to delete city: ${err.message}`);
      }
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCity.trim()) return;

    try {
      await api.addServiceCity({
        name: formCity.trim(),
        state: formState.trim(),
        is_active: true,
      });
      setShowAddModal(false);
      setFormCity('');
      await loadCities();
    } catch (err: any) {
      alert(`Failed to add city: ${err.message}`);
    }
  };

  const filtered = cities.filter((city) => {
    if (statusFilter === 'Active' && !city.is_active) return false;
    if (statusFilter === 'Inactive' && city.is_active) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return city.name.toLowerCase().includes(q) || (city.state && city.state.toLowerCase().includes(q));
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Location Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Manage serviceable cities, states, and coverage areas for provider dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv('Service_Locations', cities)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setFormCity('');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add City</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Stat Cards (Dynamic from real database) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Total Cities</span>
          <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
            {totalCities}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Configured in DB</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Active Serviceable</span>
          <span className="text-xl font-black text-[#16A34A] block mt-1 font-mono">
            {activeCount}
          </span>
          <span className="text-[10px] text-[#16A34A] mt-0.5 block font-semibold">Available in app</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 block">Disabled Cities</span>
          <span className="text-xl font-black text-slate-400 block mt-1 font-mono">
            {inactiveCount}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-semibold">Paused</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:max-w-md bg-[#FAF9F5] rounded-2xl border border-slate-200 flex items-center px-4 py-2.5 text-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or state..."
              className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Cities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">City Name</th>
                <th className="py-3 px-3">State / Province</th>
                <th className="py-3 px-3">Serviceable In App</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading live cities from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No cities found in database matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((city) => (
                  <tr key={city.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center font-bold text-xs">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900">{city.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-700">
                      {city.state || 'India'}
                    </td>

                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleCity(city.id, city.is_active)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                          city.is_active ? 'bg-[#16A34A]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            city.is_active ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-3.5 px-3">
                      {city.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete City"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add City Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Add Service Location</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCity} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="e.g. Warangal"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={formState}
                  onChange={(e) => setFormState(e.target.value)}
                  placeholder="e.g. Telangana"
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
                  Add to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
