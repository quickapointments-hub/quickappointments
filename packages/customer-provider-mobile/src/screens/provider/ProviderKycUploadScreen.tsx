import React, { useState, useRef } from 'react';
import { mobileApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Upload,
  CreditCard,
  Building,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Lock,
  Camera,
  Image as ImageIcon,
  FileText,
  Trash2,
  Eye,
  X,
} from 'lucide-react';

interface ProviderKycUploadScreenProps {
  businessData: any;
  onSuccess: () => void;
  onBack: () => void;
}

const compressUploadFile = (file: File): Promise<{ fileName: string; mimeType: string; fileUrl: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.onload = () => {
      const result = String(reader.result || '');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        resolve({
          fileName: file.name,
          mimeType: 'application/pdf',
          fileUrl: result,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        resolve({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileUrl: result,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 1920;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ fileName: file.name, mimeType: file.type, fileUrl: result });
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          fileName: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          mimeType: 'image/jpeg',
          fileUrl: canvas.toDataURL('image/jpeg', 0.82),
        });
      };
      img.onerror = () => resolve({ fileName: file.name, mimeType: file.type, fileUrl: result });
      img.src = result;
    };
    reader.readAsDataURL(file);
  });

export const ProviderKycUploadScreen: React.FC<ProviderKycUploadScreenProps> = ({
  businessData,
  onSuccess,
  onBack,
}) => {
  const { user, refreshProfile } = useAuth();
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<{ fileName: string; mimeType: string; fileUrl: string } | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [previewModalDoc, setPreviewModalDoc] = useState<{ title: string; url: string; isPdf: boolean } | null>(null);

  const cameraPickerRef = useRef<HTMLInputElement | null>(null);
  const galleryPickerRef = useRef<HTMLInputElement | null>(null);
  const filePickerRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setShowSourceModal(false);
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('File size must be under 6MB');
      return;
    }
    try {
      setError(null);
      const compressed = await compressUploadFile(file);
      setUploadedDoc(compressed);
    } catch (err: any) {
      setError(err?.message || 'Could not process document');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panNumber || !accountNumber || !ifscCode || !accountHolderName) {
      setError('Please provide PAN card, bank details, and account holder name');
      return;
    }
    if (!uploadedDoc) {
      setError('Please upload your identity proof document before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await mobileApi.onboardProvider({
        ...businessData,
        userId: user?.id,
        panNumber: panNumber.toUpperCase(),
        aadhaarNumber,
        documents: [
          {
            docType: 'PAN_CARD',
            documentNumber: panNumber.toUpperCase(),
            fileName: uploadedDoc.fileName,
            mimeType: uploadedDoc.mimeType,
            fileUrl: uploadedDoc.fileUrl,
          },
          ...(aadhaarNumber.trim()
            ? [
                {
                  docType: 'AADHAAR_CARD',
                  documentNumber: aadhaarNumber.trim(),
                  fileName: uploadedDoc.fileName,
                  mimeType: uploadedDoc.mimeType,
                  fileUrl: uploadedDoc.fileUrl,
                },
              ]
            : []),
        ],
        bankAccount: {
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          accountHolderName,
        },
      });

      await refreshProfile();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24 px-5 pt-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Step 2 of 3</span>
          <h2 className="text-base font-bold font-display text-slate-900 tracking-tight">
            KYC & Bank Settlements
          </h2>
        </div>
      </div>

      {/* Assurance banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-bold">256-bit Encrypted Banking & Identity Verification</p>
          <p className="text-[11px] text-blue-800/80 mt-0.5">
            Your bank details are securely used exclusively for automated T+1 daily payouts.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Document Section */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-brand-600" />
            <span>Government Identity Proof</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">PAN Card Number *</label>
              <input
                type="text"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Aadhaar (Last 4 Digits)</label>
              <input
                type="text"
                placeholder="XXXX-9876"
                maxLength={9}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Hidden Pickers */}
          <input
            ref={cameraPickerRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryPickerRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={filePickerRef}
            type="file"
            accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploadedDoc ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {uploadedDoc.mimeType.includes('pdf') ? (
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-400 shrink-0 bg-white">
                    <img src={uploadedDoc.fileUrl} alt="KYC Proof" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="font-bold text-xs text-emerald-900 block truncate">
                    {uploadedDoc.fileName}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    High Clarity &amp; Compressed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewModalDoc({
                      title: 'Identity Proof Document',
                      url: uploadedDoc.fileUrl,
                      isPdf: uploadedDoc.mimeType.includes('pdf'),
                    })
                  }
                  className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer hover:bg-slate-50"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setShowSourceModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] cursor-pointer hover:bg-emerald-700"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => setUploadedDoc(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowSourceModal(true)}
              className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all border-slate-200 hover:border-brand-500 bg-slate-50/60"
            >
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Upload Identity Proof (PNG, JPG, PDF)</p>
                <p className="text-[10px] text-slate-400">Camera, Gallery or Local File (Under 6MB)</p>
              </div>
            </div>
          )}
        </div>

        {/* Bank Account Section */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-brand-600" />
            <span>Bank Settlement Account</span>
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">Account Holder Full Name *</label>
            <input
              type="text"
              placeholder="As registered with your bank"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Account Number *</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">IFSC Code *</label>
              <input
                type="text"
                placeholder="HDFC0001234"
                maxLength={11}
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
        >
          {submitting ? (
            <span>Submitting KYC Application...</span>
          ) : (
            <>
              <span>Submit Application for Review</span>
              <ArrowRight className="w-4 h-4 text-brand-400" />
            </>
          )}
        </button>
      </form>

      {/* Upload Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-2 mb-2" />
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Choose Document Source</h3>
                <p className="text-[11px] text-slate-500">Supported: PNG, JPG, JPEG, PDF (Max 6MB)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSourceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => cameraPickerRef.current?.click()}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Take Photo with Camera</h4>
                  <p className="text-[10px] text-slate-500">Capture document clearly</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => galleryPickerRef.current?.click()}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Photo Library (Gallery)</h4>
                  <p className="text-[10px] text-slate-500">Select PNG / JPG from gallery</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => filePickerRef.current?.click()}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/30 flex items-center gap-3 text-left transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Browse Files / PDF</h4>
                  <p className="text-[10px] text-slate-500">Select PDF or scanned image</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSourceModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">{previewModalDoc.title}</h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Verified Clarity
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-900/5 min-h-[300px]">
              {previewModalDoc.isPdf ? (
                <iframe
                  src={previewModalDoc.url}
                  title={previewModalDoc.title}
                  className="w-full h-[450px] rounded-xl border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewModalDoc.url}
                  alt={previewModalDoc.title}
                  className="max-h-[450px] max-w-full object-contain rounded-xl shadow-md bg-white"
                />
              )}
            </div>

            <div className="p-3 border-t bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalDoc(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

