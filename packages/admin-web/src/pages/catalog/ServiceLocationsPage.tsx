import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import { exportToCsv } from '../../utils/exportCsv';
import {
  MapPin,
  CheckCircle2,
  Plus,
  Download,
  Search,
  Trash2,
  Edit2,
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export interface LocationItem {
  id: string;
  country: string;
  state: string;
  city: string;
  district: string;
  pincode: string;
  is_active: boolean;
  customer_count?: number;
  provider_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface ParsedBulkRow {
  pincode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  is_active: boolean;
  isValid: boolean;
  error?: string;
}

export const ServiceLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [stateFilter, setStateFilter] = useState<string>('All');

  // Add Location Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formCountry, setFormCountry] = useState('India');
  const [formState, setFormState] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingLoc, setEditingLoc] = useState<LocationItem | null>(null);
  const [editCountry, setEditCountry] = useState('India');
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<ParsedBulkRow[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadLocations();

    const channel = supabase
      .channel('location-master-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'location_master' }, () => {
        loadLocations();
      })
      .subscribe();

    const unsub = api.subscribeToSync((ev) => {
      if (ev === 'locations_updated' || ev === 'cities_updated') loadLocations();
    });

    return () => {
      supabase.removeChannel(channel);
      unsub();
    };
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await api.getLocations();
      if (res?.data) {
        setLocations(res.data);
      }
    } catch (e) {
      console.warn('Error loading location master from database:', e);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const totalLocations = locations.length;
  const activeCount = locations.filter((l) => l.is_active).length;
  const inactiveCount = locations.filter((l) => !l.is_active).length;
  const totalProviders = locations.reduce((sum, l) => sum + (l.provider_count || 0), 0);
  const totalCustomers = locations.reduce((sum, l) => sum + (l.customer_count || 0), 0);

  // Available states for filter
  const availableStates = Array.from(new Set(locations.map((l) => l.state).filter(Boolean))).sort();

  // Handle Toggle Active
  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.toggleLocationStatus(id, !currentActive);
      setLocations((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_active: !currentActive } : l))
      );
    } catch (err: any) {
      alert(`Failed to update PIN code status: ${err.message}`);
    }
  };

  // Handle Delete
  const handleDeleteLocation = async (id: string, pincode: string) => {
    if (confirm(`Are you sure you want to remove PIN code ${pincode} from serviceable locations? Users in this area will no longer be able to register.`)) {
      try {
        await api.deleteLocation(id);
        setLocations((prev) => prev.filter((l) => l.id !== id));
      } catch (err: any) {
        alert(`Failed to delete location: ${err.message}`);
      }
    }
  };

  // Handle Add Single Location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = formPincode.replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      alert('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!formCity.trim() || !formState.trim() || !formDistrict.trim()) {
      alert('Please fill in State, City, and District.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.addLocation({
        country: formCountry.trim() || 'India',
        state: formState.trim(),
        city: formCity.trim(),
        district: formDistrict.trim(),
        pincode: cleanPin,
        is_active: formIsActive,
      });

      setShowAddModal(false);
      setFormPincode('');
      setFormCity('');
      setFormState('');
      setFormDistrict('');
      await loadLocations();
    } catch (err: any) {
      alert(`Failed to register PIN code: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Open Edit Modal
  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLoc(loc);
    setEditCountry(loc.country || 'India');
    setEditState(loc.state || '');
    setEditCity(loc.city || '');
    setEditDistrict(loc.district || '');
    setEditIsActive(loc.is_active);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;

    try {
      setIsSubmitting(true);
      await api.updateLocation(editingLoc.id, {
        country: editCountry.trim() || 'India',
        state: editState.trim(),
        city: editCity.trim(),
        district: editDistrict.trim(),
        is_active: editIsActive,
      });
      setEditingLoc(null);
      await loadLocations();
    } catch (err: any) {
      alert(`Failed to update location: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Sample CSV/Excel Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'pincode,city,district,state,country,is_active\n' +
      '500081,Hyderabad,Rangareddy,Telangana,India,TRUE\n' +
      '560001,Bengaluru,Bangalore Urban,Karnataka,India,TRUE\n' +
      '400001,Mumbai,Mumbai City,Maharashtra,India,TRUE\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'quick_appointments_locations_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse Uploaded CSV / Excel file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          alert('Uploaded file is empty or missing data rows.');
          return;
        }

        const headerLine = lines[0].toLowerCase();
        const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';
        const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

        const pinIdx = headers.findIndex((h) => h.includes('pin') || h.includes('postal'));
        const cityIdx = headers.findIndex((h) => h.includes('city') || h.includes('town'));
        const distIdx = headers.findIndex((h) => h.includes('dist'));
        const stateIdx = headers.findIndex((h) => h.includes('state') || h.includes('province'));
        const countryIdx = headers.findIndex((h) => h.includes('country'));
        const activeIdx = headers.findIndex((h) => h.includes('active') || h.includes('status'));

        if (pinIdx === -1 || cityIdx === -1 || stateIdx === -1) {
          alert('CSV Header must contain columns: pincode, city, state (and optionally district, country, is_active).');
          return;
        }

        const parsed: ParsedBulkRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const rawCols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
          const pinRaw = rawCols[pinIdx] || '';
          const cleanPin = pinRaw.replace(/\D/g, '').trim();
          const city = rawCols[cityIdx] || '';
          const district = distIdx !== -1 && rawCols[distIdx] ? rawCols[distIdx] : city;
          const state = rawCols[stateIdx] || '';
          const country = countryIdx !== -1 && rawCols[countryIdx] ? rawCols[countryIdx] : 'India';
          const activeRaw = activeIdx !== -1 ? (rawCols[activeIdx] || 'true').toLowerCase() : 'true';
          const isActive = activeRaw === 'true' || activeRaw === '1' || activeRaw === 'active' || activeRaw === 'yes';

          let isValid = true;
          let error = '';

          if (cleanPin.length !== 6) {
            isValid = false;
            error = 'PIN code must be 6 digits';
          } else if (!city || !state) {
            isValid = false;
            error = 'City and State required';
          }

          parsed.push({
            pincode: cleanPin || pinRaw,
            city,
            district,
            state,
            country,
            is_active: isActive,
            isValid,
            error,
          });
        }

        setBulkRows(parsed);
      } catch (err: any) {
        alert(`Failed to parse file: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  // Submit Bulk Upload
  const handleConfirmBulkUpload = async () => {
    const validRows = bulkRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid location rows to upload.');
      return;
    }

    try {
      setBulkLoading(true);
      const res = await api.bulkUploadLocations(validRows);
      alert(`Bulk upload complete! Inserted: ${res.data?.inserted ?? validRows.length}, Updated: ${res.data?.updated ?? 0}`);
      setShowBulkModal(false);
      setBulkRows([]);
      setBulkFileName('');
      await loadLocations();
    } catch (err: any) {
      alert(`Bulk upload failed: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Filtered List
  const filtered = locations.filter((loc) => {
    if (statusFilter === 'Active' && !loc.is_active) return false;
    if (statusFilter === 'Inactive' && loc.is_active) return false;
    if (stateFilter !== 'All' && loc.state !== stateFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      loc.pincode.includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.district.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Location Master & PIN Code Controls
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Admin controls where the platform operates. Customers and Service Providers can only register in active PIN codes configured here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            title="Download Excel / CSV template for bulk upload"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Template
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            Bulk Upload Excel / CSV
          </button>

          <button
            onClick={() => exportToCsv('Service_Locations_Master', locations)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add PIN Code
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total PIN Codes</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalLocations}</span>
            <span className="text-xs text-slate-500 font-medium">registered in Master</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Serviceable</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
            <span className="text-xs text-emerald-600 font-medium">allowing registration</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Inactive / Suspended</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{inactiveCount}</span>
            <span className="text-xs text-slate-500 font-medium">blocked from signup</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Providers & Users</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalProviders + totalCustomers}</span>
            <span className="text-xs text-slate-500 font-medium">
              ({totalProviders} prov / {totalCustomers} cust)
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PIN code, city, district, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* State Filter */}
          {availableStates.length > 0 && (
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All States ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          {/* Status Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {(['All', 'Active', 'Inactive'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={loadLocations}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all"
            title="Refresh locations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">PIN Code</th>
                <th className="py-3.5 px-6">City</th>
                <th className="py-3.5 px-6">District</th>
                <th className="py-3.5 px-6">State / Country</th>
                <th className="py-3.5 px-6 text-center">Service Status</th>
                <th className="py-3.5 px-6 text-center">Providers</th>
                <th className="py-3.5 px-6 text-center">Customers</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && locations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                    Loading verified location records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No locations matching "{search || statusFilter}". Click "Add PIN Code" or "Bulk Upload" to configure serviceable areas.
                  </td>
                </tr>
              ) : (
                filtered.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* PIN Code */}
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-800 tracking-wider">
                          {loc.pincode}
                        </span>
                      </div>
                    </td>

                    {/* City */}
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {loc.city}
                      </div>
                    </td>

                    {/* District */}
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {loc.district || loc.city}
                    </td>

                    {/* State & Country */}
                    <td className="py-4 px-6 text-slate-600">
                      <div className="font-medium text-slate-800">{loc.state}</div>
                      <div className="text-[10px] text-slate-400">{loc.country || 'India'}</div>
                    </td>

                    {/* Active Status Switch */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(loc.id, loc.is_active)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                          loc.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            loc.is_active ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        />
                        {loc.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Providers count */}
                    <td className="py-4 px-6 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                        {loc.provider_count || 0}
                      </span>
                    </td>

                    {/* Customers count */}
                    <td className="py-4 px-6 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">
                        {loc.customer_count || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit Location"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(loc.id, loc.pincode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single PIN Code Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Serviceable PIN Code</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Indian PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 500081"
                  value={formPincode}
                  onChange={(e) => setFormPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rangareddy"
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Telangana"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500"
                />
                <label htmlFor="formIsActive" className="text-xs font-medium text-slate-700">
                  Enable active service registration immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Edit Location ({editingLoc.pincode})
                </h3>
              </div>
              <button
                onClick={() => setEditingLoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code (Read Only)</label>
                <input
                  type="text"
                  value={editingLoc.pincode}
                  disabled
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700">
                  Service Active (Registration allowed in this area)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Excel / CSV Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bulk Upload Serviceable PIN Codes</h3>
                  <p className="text-[11px] text-slate-500">
                    Upload an Excel-exported CSV file to register multiple PIN codes at once.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkRows([]);
                  setBulkFileName('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* File Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {bulkFileName ? `Selected: ${bulkFileName}` : 'Click or drop Excel / CSV file here'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Accepts .csv format with columns: pincode, city, district, state, country, is_active
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview Table */}
              {bulkRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Parsed Preview: {bulkRows.length} rows ({bulkRows.filter((r) => r.isValid).length} valid,{' '}
                      {bulkRows.filter((r) => !r.isValid).length} errors)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-600">
                        <tr>
                          <th className="p-2">PIN</th>
                          <th className="p-2">City</th>
                          <th className="p-2">District</th>
                          <th className="p-2">State</th>
                          <th className="p-2 text-center">Status</th>
                          <th className="p-2">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkRows.map((r, idx) => (
                          <tr key={idx} className={r.isValid ? 'bg-white' : 'bg-rose-50/50'}>
                            <td className="p-2 font-mono font-bold text-slate-800">{r.pincode}</td>
                            <td className="p-2">{r.city}</td>
                            <td className="p-2">{r.district}</td>
                            <td className="p-2">{r.state}</td>
                            <td className="p-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {r.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> OK
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> {r.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Template CSV
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkRows([]);
                    setBulkFileName('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  disabled={bulkRows.filter((r) => r.isValid).length === 0 || bulkLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {bulkLoading
                    ? 'Importing...'
                    : `Import ${bulkRows.filter((r) => r.isValid).length} Locations`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ServiceLocationsPage;
