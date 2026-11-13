import React, { useState } from 'react';
import { api } from '../../api';
import {
  User,
  Shield,
  KeyRound,
  Smartphone,
  CheckCircle2,
  Clock,
  Laptop,
  Check,
} from 'lucide-react';

interface AdminProfilePageProps {
  adminUser?: any;
  onUpdateAdminUser?: (user: any) => void;
}

export const AdminProfilePage: React.FC<AdminProfilePageProps> = ({
  adminUser,
  onUpdateAdminUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | '2fa' | 'sessions'>('profile');

  // Profile Form States
  const [fullName, setFullName] = useState(adminUser?.fullName || 'Admin');
  const [email, setEmail] = useState(adminUser?.email || 'admin@quickappointments.com');
  const [role, setRole] = useState(adminUser?.activeRole || 'Super Admin');
  const [mobileNumber, setMobileNumber] = useState('+91 98765 43210');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.updateAdminProfile({
        fullName,
        email,
        phone: mobileNumber,
      });
      const updated = {
        ...adminUser,
        ...(res?.user || {}),
        fullName,
        email,
        activeRole: role,
        mobileNumber,
        timezone,
      };
      onUpdateAdminUser?.(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to update administrator profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    try {
      await api.changeAdminPassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      alert(err?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View and update your profile, password and security settings.
        </p>
      </div>

      {/* Tabs Row matching Reference Screenshot */}
      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'password'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Change Password
        </button>

        <button
          onClick={() => setActiveTab('2fa')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === '2fa'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Two-Factor Authentication
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sessions'
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Active Sessions
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>Profile details updated successfully!</span>
        </div>
      )}

      {/* Tab 1: Profile Details (Exact Split Layout from Screenshot) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Admin Identity Card */}
          <div className="lg:col-span-4 bg-[#F2FAF5] rounded-3xl p-8 border border-emerald-100 flex flex-col items-center text-center shadow-sm">
            {/* Green Circular Avatar with 'A' */}
            <div className="w-20 h-20 rounded-full bg-[#86EFAC]/40 border-4 border-white flex items-center justify-center shadow-sm mb-4">
              <span className="text-3xl font-extrabold text-[#15803D]">
                {(fullName || 'A').charAt(0).toUpperCase()}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {fullName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">{email}</p>

            {/* Role Badge */}
            <div className="px-3 py-1 rounded-full bg-emerald-100 text-[#16A34A] font-bold text-[11px] tracking-wide">
              {role}
            </div>

            <div className="w-full mt-6 pt-6 border-t border-emerald-200/50 space-y-2 text-left text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Account Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  Active
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>MFA Protection</span>
                <span className="text-slate-700 font-medium">Enabled (SMS)</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Last Login</span>
                <span className="text-slate-700 font-medium">Today, 09:15 AM</span>
              </div>
            </div>
          </div>

          {/* Right Column: Update Profile Details Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-6">
              Update Profile Details
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] font-medium text-slate-900"
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] font-medium text-slate-900 bg-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Operations Admin">Operations Admin</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="Support Admin">Support Admin</option>
                  </select>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] font-medium text-slate-900"
                    required
                  />
                </div>

                {/* Status Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Status
                  </label>
                  <div className="pt-1">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-100/70 text-[#16A34A] font-bold text-xs">
                      Active
                    </span>
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] font-medium text-slate-900"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] font-medium text-slate-900 bg-white"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York (EST)">America/New_York (EST)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons matching Reference Screenshot */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFullName(adminUser?.fullName || 'Admin');
                    setEmail(adminUser?.email || 'admin@quickappointments.com');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-[#16A34A] text-[#16A34A] hover:bg-emerald-50 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Tab 2: Change Password */}
      {activeTab === 'password' && (
        <div className="max-w-xl bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900">Change Password</h2>
          
          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Password updated successfully!</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                required
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Two-Factor Authentication */}
      {activeTab === '2fa' && (
        <div className="max-w-2xl bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#16A34A]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-500">Add an extra layer of security to your admin account.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#16A34A]" />
              <div>
                <p className="text-xs font-bold text-slate-800">SMS Verification OTP</p>
                <p className="text-[11px] text-slate-500">Receive an OTP on +91 98765 43210 during login</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#16A34A] text-xs font-bold">
              Active
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Active Sessions */}
      {activeTab === 'sessions' && (
        <div className="max-w-3xl bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900">Current Active Sessions</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-[#16A34A]" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">Windows 11 – Chrome Browser</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16A34A] text-white">
                      Current Session
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Hyderabad, India • IP 106.51.72.18</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Active now</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

