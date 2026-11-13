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
      if (!file.type.startsWith('image/') || file.size <= 420 * 1024) {
        resolve({ fileName: file.name, mimeType: file.type || 'application/octet-stream', fileUrl: result });
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ fileName: file.name, mimeType: file.type, fileUrl: result });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          fileName: file.name,
          mimeType: 'image/jpeg',
          fileUrl: canvas.toDataURL('image/jpeg', 0.72),
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB');
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              uploadedDoc
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-slate-200 hover:border-brand-500 bg-slate-50/60'
            }`}
          >
            {uploadedDoc ? (
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs truncate max-w-[240px]">
                  Document Attached ({uploadedDoc.fileName})
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Upload Identity Proof (PDF or JPG)</p>
                <p className="text-[10px] text-slate-400">Tap to upload file up to 5MB</p>
              </div>
            )}
          </div>
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
    </div>
  );
};

