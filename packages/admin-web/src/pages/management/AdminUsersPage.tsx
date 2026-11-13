import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  Download,
  Plus,
  Search,
  Mail,
  Phone,
  Crown,
  Settings as GearIcon,
  BarChart3,
  Headphones,
  Edit2,
  UserCog,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';

interface AdminUserRecord {
  id: string;
  name: string;
  initial: string;
  avatarColor: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Admin' | 'Operations' | 'Reports' | 'Support';
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'Super Admin' | 'Admin' | 'Operations' | 'Reports' | 'Support'>('Admin');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      const dbUsers = res.data || [];

      if (dbUsers.length > 0) {
        const mapped: AdminUserRecord[] = dbUsers.map((u: any, idx: number) => {
          const dept = u.admin_users?.[0]?.department || 'Admin';
          let roleMapped: 'Super Admin' | 'Admin' | 'Operations' | 'Reports' | 'Support' = 'Admin';
          if (dept.toLowerCase().includes('super')) roleMapped = 'Super Admin';
          else if (dept.toLowerCase().includes('oper')) roleMapped = 'Operations';
          else if (dept.toLowerCase().includes('rep')) roleMapped = 'Reports';
          else if (dept.toLowerCase().includes('sup')) roleMapped = 'Support';

          const colors = [
            'bg-emerald-100 text-[#16A34A]',
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-amber-100 text-amber-700',
          ];

          return {
            id: u.id || `adm-db-${idx}`,
            name: u.full_name || 'Admin Officer',
            initial: (u.full_name || 'AO').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
            avatarColor: colors[idx % colors.length],
            email: u.email || 'admin@quickappointments.com',
            phone: u.phone || '+91 98765 43210',
            role: roleMapped,
            status: u.is_active !== false ? 'Active' : 'Inactive',
            lastLogin: 'Recently active',
          };
        });

        setUsers(mapped);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.warn('Failed to load admin users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminUsers();
  }, []);

  // Dynamically derived live metrics from real dataset
  const totalUsers = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'Active').length;
  const inactiveUsersCount = users.filter((u) => u.status === 'Inactive').length;
  const totalRolesCount = new Set(users.map((u) => u.role)).size;

  const filtered = users.filter((u) => {
    if (activeTab === 'Active' && u.status !== 'Active') return false;
    if (activeTab === 'Inactive' && u.status !== 'Inactive') return false;
    if (statusFilter !== 'All' && u.status !== statusFilter) return false;
    if (roleFilter !== 'All' && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (confirm('Delete this admin user and revoke access?')) {
      try {
        if (!id.startsWith('adm-')) {
          await api.deleteAdminUser(id);
        }
      } catch (e) {
        console.warn('Delete admin from DB warning:', e);
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('+91 ');
    setFormRole('Admin');
    setFormStatus('Active');
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: AdminUserRecord) => {
    setEditingUser(u);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPhone(u.phone);
    setFormRole(u.role);
    setFormStatus(u.status);
    setShowAddModal(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName,
                email: formEmail,
                phone: formPhone,
                role: formRole,
                status: formStatus,
              }
            : u
        )
      );
    } else {
      let createdId = `adm-${Date.now()}`;
      try {
        const res = await api.inviteAdminUser({
          email: formEmail,
          fullName: formName,
          phone: formPhone,
          role: formRole,
        });
        if (res.data?.id) createdId = res.data.id;
      } catch (err) {
        console.warn('Invite admin user DB warning:', err);
      }

      const newUser: AdminUserRecord = {
        id: createdId,
        name: formName,
        initial: formName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        avatarColor: 'bg-emerald-100 text-[#16A34A]',
        email: formEmail,
        phone: formPhone,
        role: formRole,
        status: formStatus,
        lastLogin: 'Never',
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setShowAddModal(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-[#16A34A]">
            <Crown className="w-3 h-3 text-[#16A34A]" />
            Super Admin
          </span>
        );
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
            <Shield className="w-3 h-3 text-blue-600" />
            Admin
          </span>
        );
      case 'Operations':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
            <GearIcon className="w-3 h-3 text-amber-600" />
            Operations
          </span>
        );
      case 'Reports':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700">
            <BarChart3 className="w-3 h-3 text-teal-600" />
            Reports
          </span>
        );
      case 'Support':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
            <Headphones className="w-3 h-3 text-purple-600" />
            Support
          </span>
        );
      default:
        return <span>{role}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Title & Top Right Actions matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin User Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage, and control admin users, roles, and access permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv('Admin_Users', users)}
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
            <span>Add Admin User</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Screenshot 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A] w-fit mb-2">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalUsers}</div>
          <span className="text-xs font-semibold text-slate-500">Total Admin Users</span>
        </div>

        <div className="bg-[#EFF6FF] rounded-2xl p-5 border border-blue-100 shadow-sm">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-600 w-fit mb-2">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{activeUsersCount}</div>
          <span className="text-xs font-semibold text-blue-700">Active Users</span>
        </div>

        <div className="bg-[#FEFCE8] rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-600 w-fit mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{inactiveUsersCount}</div>
          <span className="text-xs font-semibold text-amber-700">Inactive Users</span>
        </div>

        <div className="bg-[#FFF1F2] rounded-2xl p-5 border border-rose-100 shadow-sm">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 w-fit mb-2">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalRolesCount}</div>
          <span className="text-xs font-semibold text-rose-700">Roles</span>
        </div>
      </div>

      {/* Pill Tabs matching Screenshot 2 */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'All'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Users ({totalUsers})
        </button>

        <button
          onClick={() => setActiveTab('Active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Active'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active ({activeUsersCount})
        </button>

        <button
          onClick={() => setActiveTab('Inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'Inactive'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Inactive ({inactiveUsersCount})
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
            placeholder="Search by name, email or phone"
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Operations">Operations</option>
            <option value="Reports">Reports</option>
            <option value="Support">Support</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setRoleFilter('All');
              setStatusFilter('All');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Admin Users Data Table matching Screenshot 2 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
              <tr>
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No admin users found. Click &quot;+ Add Admin User&quot; to invite a team member.
                  </td>
                </tr>
              ) : (
                filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-semibold">{idx + 1}</td>

                    {/* User with avatar badge */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full ${u.avatarColor} font-bold flex items-center justify-center text-xs`}
                        >
                          {u.initial}
                        </div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {u.email}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {u.phone}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">{getRoleBadge(u.role)}</td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {u.lastLogin}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const nextRole =
                              u.role === 'Admin'
                                ? 'Operations'
                                : u.role === 'Operations'
                                ? 'Support'
                                : 'Admin';
                            setUsers((prev) =>
                              prev.map((item) => (item.id === u.id ? { ...item, role: nextRole as any } : item))
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Change Role"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete User"
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
              ? 'Showing 0 of 0 users'
              : `Showing 1 – ${filtered.length} of ${totalUsers} users`}
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

      {/* Add / Edit Admin User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit Admin User' : 'Add New Admin User'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@quickappointments.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e: any) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Operations">Operations</option>
                    <option value="Reports">Reports</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Active">Active</option>
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
                  {editingUser ? 'Save Changes' : 'Grant Admin Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
