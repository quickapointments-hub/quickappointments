import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { UserCog, Plus, Shield, ShieldCheck, Mail, Phone, CheckCircle2, XCircle } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [role, setRole] = useState('OPERATIONS_ADMIN');
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviting(true);
      await api.inviteAdminUser({ email, fullName, phone, role });
      setSuccessMsg(`Admin user ${fullName} invited successfully with ${role} permissions.`);
      setIsInviteModalOpen(false);
      setEmail('');
      setFullName('');
      setPhone('+91');
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Invite failed: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await api.updateAdminUser(userId, { isActive: !currentStatus });
      await loadUsers();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateAdminUser(userId, { role: newRole });
      await loadUsers();
    } catch (err: any) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-5 h-5 text-brand-600" />
            <span>Administrative Governance & Roles (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative personnel, grant role-based authorizations, and control console access.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Admin User</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Breakdown Explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-slate-900 block">Super Admin</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Full platform & RBAC authority</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-slate-900 block">Operations Admin</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">KYC verification & catalog curation</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-slate-900 block">Finance Admin</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Commissions, 100% refunds & payouts</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="font-bold text-slate-900 block">Support Admin</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Disputes, complaints & customer help</span>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Admin Profile</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Added Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading administrative accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {u.fullName.charAt(0)}
                      </div>
                      <span>{u.fullName}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <div>{u.email || '-'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.roles[0] || 'ADMIN'}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="SUPERADMIN">Super Admin</option>
                        <option value="OPERATIONS_ADMIN">Operations Admin</option>
                        <option value="FINANCE_ADMIN">Finance Admin</option>
                        <option value="SUPPORT_ADMIN">Support Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                          u.isActive
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Invite Administrative User</h3>
            <form onSubmit={handleInvite} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@quickappointments.in"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Administrative Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-medium bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="OPERATIONS_ADMIN">Operations Admin (KYC & Catalog)</option>
                  <option value="FINANCE_ADMIN">Finance Admin (Commissions & Payouts)</option>
                  <option value="SUPPORT_ADMIN">Support Admin (Disputes & Help)</option>
                  <option value="SUPERADMIN">Super Admin (Unrestricted)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

