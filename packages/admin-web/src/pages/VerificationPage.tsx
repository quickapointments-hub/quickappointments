import React, { useEffect, useState } from 'react';
import { api } from '../api';
import {
  ShieldCheck,
  ShieldX,
  FileText,
  Building2,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await api.getProviders();
      setProviders(res.data || []);
      if (res.data && res.data.length > 0 && !selectedProvider) {
        setSelectedProvider(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (providerId: string) => {
    try {
      await api.verifyProvider(providerId, 'APPROVE');
      setActionSuccess('Provider approved and activated successfully! Account is now live.');
      await loadProviders();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleReject = async () => {
    if (!selectedProvider || !rejectionReason.trim()) {
      alert('Please state a reason for rejection.');
      return;
    }
    try {
      await api.verifyProvider(selectedProvider.id, 'REJECT', rejectionReason);
      setActionSuccess('Provider status updated to REJECTED with reason recorded in audit log.');
      setIsRejectModalOpen(false);
      setRejectionReason('');
      await loadProviders();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const pendingList = providers.filter((p) => p.verificationStatus === 'PENDING');
  const otherList = providers.filter((p) => p.verificationStatus !== 'PENDING');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>Provider KYC Verification & Audit</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review government ID proofs, trade certificates, business addresses, and enforce platform trust.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {pendingList.length} Pending Decision
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {providers.filter((p) => p.verificationStatus === 'APPROVED').length} Active
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Split Layout: Provider List (Left) + Detailed Audit Inspection (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Provider Queue */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Verification Pipeline
            </h3>
            <div className="space-y-2">
              {providers.map((p) => {
                const isSelected = selectedProvider?.id === p.id;
                const isPending = p.verificationStatus === 'PENDING';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProvider(p)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {p.businessName || p.user?.fullName}
                        </h4>
                        <p className="text-slate-500 mt-0.5">{p.user?.fullName} • {p.user?.phone}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : p.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.verificationStatus}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{p.city}</span>
                      <span>{p.providerType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed KYC Inspector */}
        <div className="lg:col-span-7">
          {selectedProvider ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Header profile */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-display text-slate-900">
                      {selectedProvider.businessName || selectedProvider.user?.fullName}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {selectedProvider.providerType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedProvider.user?.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedProvider.address}, {selectedProvider.city}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedProvider.id)}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Go Live</span>
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Business & Experience details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedProvider.experienceYears} Years
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Radius</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedProvider.serviceRadiusKm || 20} km
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Customer Rating</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    ★ {selectedProvider.ratingAvg} ({selectedProvider.ratingCount} reviews)
                  </p>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Compliance Verification Documents ({selectedProvider.documents?.length || 0})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedProvider.documents || []).length === 0 ? (
                    <div className="col-span-2 p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No documents uploaded yet.
                    </div>
                  ) : (
                    selectedProvider.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">{doc.documentType}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {doc.documentNumber || 'Ref Attached'}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.isVerified ? 'Verified' : 'Pending Audit'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit trail indicator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
                <span className="font-semibold text-slate-700">Audit Compliance:</span> Every status transition is automatically committed to the immutable database audit ledger with operator ID and timestamp.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a provider from the left list to review KYC documents.
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-rose-600" />
              <span>Reject Provider Application</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please specify the reason for rejection. This reason will be recorded in the audit log and dispatched directly to the provider:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Government ID image blurred, Trade License expired, Address mismatch..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

