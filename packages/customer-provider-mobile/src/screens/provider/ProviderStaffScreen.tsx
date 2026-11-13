import React, { useState, useEffect } from 'react';
import { mobileApi } from '../../api';
import {
  ArrowLeft,
  Users,
  Plus,
  Briefcase,
  Calendar,
  X,
  UserCheck,
} from 'lucide-react';

interface ProviderStaffScreenProps {
  onBack: () => void;
}

export const ProviderStaffScreen: React.FC<ProviderStaffScreenProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', specialty: '', workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getProviderStaff();
      setStaff(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      setSubmitting(true);
      await mobileApi.addProviderStaff(formData);
      setShowAddModal(false);
      setFormData({ name: '', specialty: '', workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat' });
      loadStaff();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
              Staff & Specialists
            </h2>
            <p className="text-[11px] text-slate-500">Manage team members and assignments</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-brand-400" />
          <span>Add Staff</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading team members...</div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-800">No staff members assigned</h4>
            <p className="text-[11px] text-slate-500">Add specialists or therapists to assign to bookings.</p>
          </div>
        ) : (
          staff.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-xs text-brand-700">
                  {s.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{s.name}</h4>
                  <p className="text-[11px] text-slate-500">{s.specialty || 'General Specialist'}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Specialty / Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Hair Stylist / Physiotherapist"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-charcoal-900 text-white font-bold"
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

