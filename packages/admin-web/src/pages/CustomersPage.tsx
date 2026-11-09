import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, Search, Phone, MapPin, CalendarCheck, ShieldAlert, ShieldCheck } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      setCustomers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customerId: string, currentActive: boolean) => {
    try {
      await api.updateCustomerStatus(customerId, !currentActive);
      await loadCustomers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.user?.fullName?.toLowerCase().includes(q) ||
      c.user?.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-600" />
          <span>Customer Account Directory</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Registered mobile consumers across India, appointment volumes, and account governance.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, mobile or city..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Contact</th>
              <th className="px-6 py-3.5">City</th>
              <th className="px-6 py-3.5">Bookings</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  Loading customer records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No customers found matching search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-800 font-bold flex items-center justify-center text-xs border border-brand-200">
                      {c.user?.fullName?.charAt(0) || 'C'}
                    </div>
                    <span>{c.user?.fullName || 'Quick Customer'}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">{c.user?.phone}</td>
                  <td className="px-6 py-4 text-slate-700">{c.city || 'Mumbai'}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{c._count?.bookings || 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.user?.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.user?.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(c.id, c.user?.isActive)}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                        c.user?.isActive
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {c.user?.isActive ? 'Block User' : 'Unblock User'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

