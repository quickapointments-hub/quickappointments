import React, { useState } from 'react';
import { mobileApi } from '../api';
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

export const ProviderKycUploadScreen: React.FC<ProviderKycUploadScreenProps> = ({
  businessData,
  onSuccess,
  onBack,
}) => {
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [docUploaded, setDocUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panNumber || !accountNumber || !ifscCode || !accountHolderName) {
      setError('Please provide PAN card, bank details, and account holder name');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Call onboarding API
      await mobileApi.onboardProvider({
        ...businessData,
        panNumber: panNumber.toUpperCase(),
        aadhaarNumber,
        bankAccount: {
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          accountHolderName,
        },
      });

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

          <div
            onClick={() => setDocUploaded(!docUploaded)}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              docUploaded
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-slate-200 hover:border-brand-500 bg-slate-50/60'
            }`}
          >
            {docUploaded ? (
              <div className="flex items-center justify-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs">Document Attached (PAN_Front.pdf)</span>
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

