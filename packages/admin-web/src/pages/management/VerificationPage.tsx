import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { supabase } from '../../supabase';
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
  AlertTriangle,
  RotateCcw,
  Camera,
  ExternalLink,
  Eye,
  X,
  Image as ImageIcon,
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Clear Image / Document Re-Upload Modal state
  const [isClarityModalOpen, setIsClarityModalOpen] = useState(false);
  const [clarityChecklist, setClarityChecklist] = useState({
    aadhaar: true,
    pan: false,
    premise: false,
    maps: false,
  });
  const [clarityCustomNotes, setClarityCustomNotes] = useState(
    'Please capture documents in bright daylight without flash glare. Ensure all text and 12-digit Aadhaar / 10-character PAN are sharp and legible.'
  );

  // Full-size Image Lightbox Modal state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    loadProviders();

    const unsubscribeSync = api.subscribeToSync((ev) => {
      if (ev === 'providers_updated' || ev === 'provider_kyc_updated') {
        loadProviders();
      }
    });

    const channel = supabase
      .channel('kyc-verification-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, () => {
        loadProviders();
      })
      .subscribe();

    return () => {
      unsubscribeSync();
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await api.getProviders();
      const list = res.data || [];
      // Normalize field names if snake_case from direct Supabase select
      const normalized = list.map((p: any) => ({
        ...p,
        verificationStatus: p.verification_status || p.verificationStatus,
        businessName: p.business_name || p.businessName,
        providerType: p.provider_type || p.providerType,
        serviceRadiusKm: p.service_radius_km || p.serviceRadiusKm,
        ratingAvg: p.rating_avg || p.ratingAvg,
        ratingCount: p.rating_count || p.ratingCount,
        experienceYears: p.experience_years || p.experienceYears,
        rejectionReason: p.rejection_reason || p.rejectionReason,
        documents: (p.documents || []).map((d: any) => ({
          ...d,
          documentType: d.document_type || d.documentType,
          documentNumber: d.document_number || d.documentNumber,
          fileUrl: d.file_url || d.fileUrl,
          isVerified: d.is_verified !== undefined ? d.is_verified : d.isVerified,
        })),
      }));

      setProviders(normalized);
      if (normalized.length > 0) {
        if (!selectedProvider) {
          setSelectedProvider(normalized[0]);
        } else {
          const updatedSelected = normalized.find((item: any) => item.id === selectedProvider.id);
          if (updatedSelected) setSelectedProvider(updatedSelected);
        }
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

  const handleSendClarityRequest = async () => {
    if (!selectedProvider) return;

    const issues: string[] = [];
    if (clarityChecklist.aadhaar) issues.push('Aadhaar Card is blurry or numbers are unreadable');
    if (clarityChecklist.pan) issues.push('PAN Card has reflection/glare or text is blurry');
    if (clarityChecklist.premise) issues.push('Workplace/Premise photo lacks signage or is unclear');
    if (clarityChecklist.maps) issues.push('Google Maps location link does not match address');

    const compiledReason = [
      'CLARITY_REUPLOAD_REQUESTED:',
      issues.length > 0 ? `Issues: ${issues.join('; ')}.` : '',
      clarityCustomNotes.trim() ? `Instructions: ${clarityCustomNotes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    try {
      await api.verifyProvider(selectedProvider.id, 'REQUEST_CLARITY', compiledReason);
      setActionSuccess('Clear HD Image Re-Upload Request dispatched to provider. Provider app will guide them to re-upload.');
      setIsClarityModalOpen(false);
      await loadProviders();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(`Failed to send clarity request: ${err.message}`);
    }
  };

  const pendingList = providers.filter((p) => p.verificationStatus === 'PENDING');
  const needsInfoList = providers.filter((p) => p.verificationStatus === 'NEEDS_INFO');
  const approvedList = providers.filter((p) => p.verificationStatus === 'APPROVED');

  // Categorize documents of selected provider
  const allDocs = selectedProvider?.documents || [];
  const googleMapsDoc = allDocs.find((d: any) => d.documentType === 'GOOGLE_MAPS' || (d.fileUrl && d.fileUrl.includes('maps')));
  const premisePhotos = allDocs.filter((d: any) => d.documentType === 'PREMISE_PHOTO');
  const kycDocs = allDocs.filter((d: any) => d.documentType !== 'GOOGLE_MAPS' && d.documentType !== 'PREMISE_PHOTO');

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
            Review government ID proofs, workplace photos, Google Maps links, and enforce HD clarity standards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {pendingList.length} Pending
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            {needsInfoList.length} Re-Uploads
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {approvedList.length} Active Live
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
              Verification Pipeline ({providers.length})
            </h3>
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {providers.map((p) => {
                const isSelected = selectedProvider?.id === p.id;
                const isPending = p.verificationStatus === 'PENDING';
                const isNeedsInfo = p.verificationStatus === 'NEEDS_INFO';
                const isApproved = p.verificationStatus === 'APPROVED';

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
                            : isNeedsInfo
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isNeedsInfo ? 'RE-UPLOAD REQUESTED' : p.verificationStatus}
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
                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
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

                {/* Verification Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleApprove(selectedProvider.id)}
                    className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Go Live</span>
                  </button>

                  <button
                    onClick={() => setIsClarityModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300 transition-all flex items-center gap-1.5"
                    title="Send request to provider to re-upload blurred or unclear documents"
                  >
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>Request Clear HD Image</span>
                  </button>

                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                  >
                    <ShieldX className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Status Warning Banner if Clarification / Re-Upload is Active */}
              {selectedProvider.verificationStatus === 'NEEDS_INFO' && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                  <div className="flex items-center gap-2 text-orange-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Clear Document Re-Upload Requested</span>
                  </div>
                  <p className="text-xs text-orange-800 leading-relaxed">
                    {selectedProvider.rejectionReason || 'Provider has been asked to re-upload clear HD images for verification.'}
                  </p>
                </div>
              )}

              {/* Business & Experience details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Experience</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedProvider.experienceYears || 1} Years
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Service Radius</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedProvider.serviceRadiusKm || 20} km
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Verification State</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedProvider.verificationStatus}
                  </p>
                </div>
              </div>

              {/* 1. Google Maps Shared Location Link */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Google Maps Shared Location</span>
                  </div>
                  {googleMapsDoc ? (
                    <a
                      href={googleMapsDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 shadow-sm transition-all"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Not Provided</span>
                  )}
                </div>
                {googleMapsDoc && (
                  <p className="text-xs font-mono text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-200">
                    {googleMapsDoc.fileUrl}
                  </p>
                )}
              </div>

              {/* 2. Premise / Workplace Photos */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>Premise / Workplace Photos ({premisePhotos.length})</span>
                </h4>
                {premisePhotos.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    No workplace/premise photos uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {premisePhotos.map((photo: any, idx: number) => (
                      <div
                        key={photo.id || idx}
                        className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer shadow-sm hover:shadow-md transition-all"
                        onClick={() =>
                          setPreviewImage({
                            url: photo.fileUrl,
                            title: `Workplace Premise Photo ${idx + 1} (${photo.documentNumber || 'HD'})`,
                          })
                        }
                      >
                        <img
                          src={photo.fileUrl}
                          alt={`Premise ${idx + 1}`}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="p-2 bg-white flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800 truncate">
                            Photo {idx + 1}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> View HD
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Uploaded KYC & Compliance Documents */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Compliance Verification Documents ({kycDocs.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {kycDocs.length === 0 ? (
                    <div className="col-span-2 p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No KYC documents uploaded yet.
                    </div>
                  ) : (
                    kycDocs.map((doc: any) => {
                      const isImage = doc.fileUrl && (doc.fileUrl.startsWith('data:image') || doc.fileUrl.match(/\.(jpeg|jpg|png|webp)/i));

                      return (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{doc.documentType}</p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {doc.documentNumber || 'Document File Attached'}
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

                          {/* Image preview thumbnail if image */}
                          {isImage ? (
                            <div
                              onClick={() => setPreviewImage({ url: doc.fileUrl, title: doc.documentType })}
                              className="relative cursor-pointer rounded-lg overflow-hidden border border-slate-200 h-24 bg-white hover:opacity-95 transition-all group"
                            >
                              <img
                                src={doc.fileUrl}
                                alt={doc.documentType}
                                className="w-full h-full object-contain p-1"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Full HD</span>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Open PDF / Document File ↗</span>
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Audit trail indicator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-xs">
                <span className="font-semibold text-slate-700">Audit Compliance:</span> Every status transition is automatically committed to the database audit ledger with operator ID and timestamp.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a provider from the left list to review KYC documents.
            </div>
          )}
        </div>
      </div>

      {/* Image Lightbox HD Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>{previewImage.title}</span>
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={previewImage.url}
                alt="Document HD Preview"
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Clear HD Image Re-Upload Modal */}
      {isClarityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-600" />
              <span>Request Clear HD Image / Document Re-Upload</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select which uploaded items lack sufficient clarity. The provider's mobile app will alert them with your notes and guide them to capture clear HD replacement photos:
            </p>

            <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clarityChecklist.aadhaar}
                  onChange={(e) => setClarityChecklist({ ...clarityChecklist, aadhaar: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-slate-800">Aadhaar Card is blurry or numbers are unreadable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clarityChecklist.pan}
                  onChange={(e) => setClarityChecklist({ ...clarityChecklist, pan: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-slate-800">PAN Card has flash glare or text is unreadable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clarityChecklist.premise}
                  onChange={(e) => setClarityChecklist({ ...clarityChecklist, premise: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-slate-800">Workplace / Premise photo lacks storefront signage or is dark</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clarityChecklist.maps}
                  onChange={(e) => setClarityChecklist({ ...clarityChecklist, maps: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-slate-800">Google Maps location link is invalid or doesn't match address</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Instructions for Service Provider:
              </label>
              <textarea
                value={clarityCustomNotes}
                onChange={(e) => setClarityCustomNotes(e.target.value)}
                placeholder="Provide clear directions for the provider (e.g. Please capture Aadhaar front side in daylight without reflection)..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsClarityModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendClarityRequest}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Send HD Re-Upload Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
