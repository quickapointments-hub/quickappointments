import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Star,
  FileText,
  Briefcase,
  IndianRupee,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Download,
  Check,
  X,
  MessageSquare,
  History,
  TrendingUp,
} from 'lucide-react';

interface ProviderDetailsPageProps {
  providerId: string;
  onBack: () => void;
}

export const ProviderDetailsPage: React.FC<ProviderDetailsPageProps> = ({
  providerId,
  onBack,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'services' | 'documents' | 'operations' | 'audit'
  >('overview');

  // Action Modals State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin Internal Notes State
  const [adminNote, setAdminNote] = useState('');
  const [adminNotesList, setAdminNotesList] = useState<
    { note: string; timestamp: string; author: string }[]
  >([]);

  useEffect(() => {
    loadDetails();

    const channel = supabase
      .channel(`provider-details-${providerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'provider_profiles', filter: `id=eq.${providerId}` },
        () => {
          loadDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'provider_documents', filter: `provider_id=eq.${providerId}` },
        () => {
          loadDetails();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `provider_id=eq.${providerId}` },
        () => {
          loadDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [providerId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getProviderDetails(providerId);
      if (res?.data) {
        setData(res.data);
      }
    } catch (e) {
      console.warn('Load provider details error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this provider? Their account will be activated to accept customer bookings.')) {
      return;
    }
    try {
      setActionLoading(true);
      await api.verifyProvider(providerId, 'APPROVE');
      addAuditLogEntry('Approved provider account and granted booking authorization');
      await loadDetails();
    } catch (e: any) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      await api.verifyProvider(providerId, 'REJECT', rejectionReason.trim());
      addAuditLogEntry(`Rejected application. Reason: "${rejectionReason.trim()}"`);
      setShowRejectModal(false);
      setRejectionReason('');
      await loadDetails();
    } catch (e: any) {
      alert(`Rejection failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    const reason = prompt('Specify what information or re-uploaded documents are required:');
    if (!reason || !reason.trim()) return;

    try {
      setActionLoading(true);
      await api.verifyProvider(providerId, 'REQUEST_CLARITY', reason.trim());
      addAuditLogEntry(`Requested additional info / document clarity: "${reason.trim()}"`);
      await loadDetails();
    } catch (e: any) {
      alert(`Request failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAcceptingBookings = async () => {
    const current = data?.profile?.is_accepting_bookings;
    try {
      setActionLoading(true);
      await api.toggleProviderAcceptingBookings(providerId, !current);
      addAuditLogEntry(
        !current
          ? 'Marked provider as Accepting Bookings (Online)'
          : 'Suspended provider from receiving new bookings (Offline)'
      );
      await loadDetails();
    } catch (e: any) {
      alert(`Status toggle failed: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDocVerification = async (docId: string, currentVerified: boolean) => {
    try {
      await api.verifyDocument(docId, !currentVerified);
      addAuditLogEntry(
        !currentVerified ? `Document ${docId} verified` : `Document ${docId} revoked verification`
      );
      await loadDetails();
    } catch (e: any) {
      alert(`Document status update failed: ${e.message}`);
    }
  };

  const addAuditLogEntry = (actionText: string) => {
    setAdminNotesList((prev) => [
      {
        note: actionText,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        author: 'Super Admin',
      },
      ...prev,
    ]);
  };

  const handleAddAdminNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNote.trim()) return;
    addAuditLogEntry(`Note: ${adminNote.trim()}`);
    setAdminNote('');
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 font-medium">
        Loading provider details from database...
      </div>
    );
  }

  const profile = data?.profile || {};
  const user = profile.user || {};
  const documents: any[] = data?.documents || [];
  const workingHours: any[] = data?.workingHours || [];
  const services: any[] = data?.services || [];
  const bookings: any[] = data?.bookings || [];

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');
  const totalGrossGenerated = completedBookings.reduce(
    (sum, b) => sum + (Number(b.total_amount) || 0),
    0
  );
  const totalProviderEarned = completedBookings.reduce(
    (sum, b) => sum + (Number(b.provider_earnings) || Number(b.total_amount) * 0.85 || 0),
    0
  );

  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shadow-xs"
            title="Back to Providers"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {profile.business_name || user.full_name || 'Provider Details'}
              </h1>
              {profile.verification_status === 'APPROVED' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              )}
              {profile.verification_status === 'PENDING' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              )}
              {profile.verification_status === 'REJECTED' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Rejected
                </span>
              )}
              {profile.verification_status === 'NEEDS_INFO' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Info
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              ID: <span className="font-mono text-slate-700">{profile.id || providerId}</span> • Registered on{' '}
              {profile.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {profile.verification_status !== 'APPROVED' && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#16A34A]/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Approve Provider</span>
            </button>
          )}

          {profile.verification_status !== 'REJECTED' && (
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>Reject</span>
            </button>
          )}

          <button
            onClick={handleRequestInfo}
            disabled={actionLoading}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Request Info</span>
          </button>

          <button
            onClick={handleToggleAcceptingBookings}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              profile.is_accepting_bookings
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] border-[#16A34A]/30'
            }`}
          >
            <span>{profile.is_accepting_bookings ? 'Suspend Bookings' : 'Activate Bookings'}</span>
          </button>
        </div>
      </div>

      {/* Rejection Notice Banner if Rejected */}
      {profile.rejection_reason && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-900 text-xs">Application Rejection Reason:</div>
            <p className="text-xs text-rose-700 mt-0.5">{profile.rejection_reason}</p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Basic & Business Profile', icon: Building2 },
          { id: 'services', label: `Categories & Services (${services.length})`, icon: Layers },
          { id: 'documents', label: `KYC Documents (${documents.length})`, icon: FileText },
          { id: 'operations', label: `Operations & Bookings (${bookings.length})`, icon: TrendingUp },
          { id: 'audit', label: 'Admin Notes & Audit Log', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC & BUSINESS PROFILE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section A: Basic Personal Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
              <User className="w-4 h-4 text-[#16A34A]" />
              Basic Personal Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Provider Full Name</span>
                <span className="font-bold text-slate-900">{user.full_name || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Mobile Phone</span>
                <span className="font-bold text-slate-900 font-mono">{user.phone || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Email Address</span>
                <span className="font-bold text-slate-900">{user.email || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Account Status</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.is_active !== false
                      ? 'bg-emerald-50 text-[#16A34A]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {user.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Accepting Bookings</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    profile.is_accepting_bookings
                      ? 'bg-[#EFF8E7] text-[#16A34A]'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {profile.is_accepting_bookings ? 'Yes (Online)' : 'Paused (Offline)'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 font-medium">Rating Score</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {profile.rating_avg ? Number(profile.rating_avg).toFixed(1) : '5.0'} (
                  {profile.rating_count || 0} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Section B: Business Information */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
              <Building2 className="w-4 h-4 text-[#16A34A]" />
              Business &amp; Operational Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Business / Trade Name</span>
                <span className="font-bold text-slate-900">{profile.business_name || 'Individual'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Provider Type</span>
                <span className="font-bold text-slate-900">{profile.provider_type || 'INDIVIDUAL'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Experience</span>
                <span className="font-bold text-slate-900">{profile.experience_years || 1} Years</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Service City</span>
                <span className="font-bold text-slate-900">{profile.city || 'Bangalore'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Service Radius</span>
                <span className="font-bold text-slate-900">{profile.service_radius_km || 20} km</span>
              </div>

              <div className="py-1">
                <span className="text-slate-400 font-medium block mb-1">Business Address</span>
                <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {profile.address || 'Address provided upon booking'}
                </p>
              </div>

              {profile.bio && (
                <div className="py-1">
                  <span className="text-slate-400 font-medium block mb-1">About / Bio</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Working Schedule */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b pb-3">
              <Clock className="w-4 h-4 text-[#16A34A]" />
              Weekly Working Schedule &amp; Availability
            </h3>

            {workingHours.length === 0 ? (
              <p className="text-xs text-slate-400">
                Standard schedule configured: Monday to Saturday, 09:00 AM – 07:00 PM.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {workingHours.map((wh) => (
                  <div
                    key={wh.id}
                    className={`p-3 rounded-2xl border text-center text-xs ${
                      wh.is_closed
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-[#EFF8E7]/50 border-[#16A34A]/20 text-slate-800'
                    }`}
                  >
                    <div className="font-bold text-[11px] mb-1">{daysMap[wh.day_of_week] || 'Day'}</div>
                    {wh.is_closed ? (
                      <span className="text-[10px] text-rose-500 font-bold">Closed</span>
                    ) : (
                      <div className="font-mono text-[10px] font-semibold text-slate-700">
                        {wh.open_time} - {wh.close_time}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES & SERVICES OFFERED */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Configured Categories &amp; Services</h3>
              <p className="text-xs text-slate-400">
                Specific services offered by this provider under main platform categories.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-[#EFF8E7] text-[#16A34A] font-bold text-xs">
              {services.length} Services Registered
            </span>
          </div>

          {services.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              No specific services configured for this provider yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((rate: any) => {
                const s = rate.service || {};
                const cat = s.category || {};
                return (
                  <div
                    key={rate.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-[#FAF9F5] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20">
                          {cat.name || 'Category'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rate.is_active !== false
                              ? 'bg-emerald-100 text-[#16A34A]'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {rate.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{s.name || 'Service Offering'}</h4>
                      {s.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1 text-slate-900 font-black">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {rate.custom_price || s.base_price || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rate.custom_duration || s.duration_minutes || 60} mins</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KYC DOCUMENTS & IDENTITY PROOFS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                KYC Verification &amp; Legal Documents
              </h3>
              <p className="text-xs text-slate-400">
                Aadhaar card, PAN card, certifications, and trade licenses submitted by provider.
              </p>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 font-medium">
              No KYC documents uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-[#FAF9F5] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                        {doc.document_type || 'Identity Proof'}
                      </span>
                      {doc.is_verified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/20 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-mono mt-1">
                      Doc No:{' '}
                      <span className="font-bold text-slate-900">
                        {doc.document_number || 'DOC-XXXX-XXXX'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Uploaded on{' '}
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('en-GB')
                        : 'Registration'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    {doc.file_url ? (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Document</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">File not attached</span>
                    )}

                    <button
                      onClick={() => handleToggleDocVerification(doc.id, doc.is_verified)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                        doc.is_verified
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                          : 'bg-[#EFF8E7] hover:bg-[#E4F4DA] text-[#16A34A] border border-[#16A34A]/20'
                      }`}
                    >
                      {doc.is_verified ? 'Revoke' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OPERATIONS & PERFORMANCE */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Total Bookings</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                {bookings.length}
              </span>
              <span className="text-[11px] text-[#16A34A] font-bold mt-1 block">
                {completedBookings.length} Completed
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Gross Volume</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">
                ₹{totalGrossGenerated.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Fulfilled customer orders
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Provider Earnings</span>
              <span className="text-xl font-black text-[#16A34A] mt-1 block">
                ₹{totalProviderEarned.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Settled + Payable
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Cancelled Orders</span>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                {cancelledBookings.length}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                Refunds processed
              </span>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-xs">
              Recent Appointments for this Provider ({bookings.length})
            </div>

            {bookings.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No appointments recorded for this provider yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F5] border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-6">Booking Ref</th>
                      <th className="py-3 px-6">Service</th>
                      <th className="py-3 px-6">Customer</th>
                      <th className="py-3 px-6">Amount</th>
                      <th className="py-3 px-6">Date / Time</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                          {b.booking_ref || `QA-${b.id.slice(0, 6).toUpperCase()}`}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          {b.service?.name || 'Service'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {b.customer?.user?.full_name || 'Customer'}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          ₹{Number(b.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {b.date || (b.created_at ? b.created_at.slice(0, 10) : 'Recent')}{' '}
                          {b.start_time || ''}
                        </td>
                        <td className="py-3.5 px-6">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-[#16A34A]'
                                : b.status === 'CANCELLED'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {b.status || 'CONFIRMED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN NOTES & AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-900">Internal Admin Notes &amp; Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Record internal admin remarks, verification decisions, and provider compliance logs.
            </p>
          </div>

          <form onSubmit={handleAddAdminNote} className="flex gap-2">
            <input
              type="text"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add an internal admin note for this provider..."
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#16A34A]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Add Note
            </button>
          </form>

          <div className="space-y-3 pt-2">
            {adminNotesList.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-6 text-center">
                No admin notes recorded yet. Actions taken on this page will automatically log here.
              </p>
            ) : (
              adminNotesList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#FAF9F5] border border-slate-100 flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{item.note}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">By {item.author}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Reject Provider Application
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Specify Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete address proof, invalid trade license, or failed background check..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

