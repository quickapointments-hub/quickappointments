import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ProviderKycStatusScreenProps {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  onOpenCockpit: () => void;
  onResubmit?: () => void;
}

export const ProviderKycStatusScreen: React.FC<ProviderKycStatusScreenProps> = ({
  status = 'PENDING',
  rejectionReason,
  onOpenCockpit,
  onResubmit,
}) => {
  return (
    <div className="pb-24 px-5 pt-8 space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Step 3 of 3</span>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          Application Status
        </h2>
        <p className="text-xs text-slate-500">KYC Verification & Account Activation</p>
      </div>

      {/* Status Graphic & Main Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner">
          {status === 'APPROVED' ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : status === 'REJECTED' ? (
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {status === 'APPROVED'
              ? 'Verification Approved!'
              : status === 'REJECTED'
              ? 'Verification Requires Action'
              : 'Application Under Review'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {status === 'APPROVED'
              ? 'Your provider account is live. You can now accept instant booking requests.'
              : status === 'REJECTED'
              ? rejectionReason || 'Your document could not be verified. Please check and re-upload.'
              : 'Our compliance team is verifying your business documents. Average turnaround time is under 4 hours.'}
          </p>
        </div>

        {/* Stepper progress */}
        <div className="pt-4 border-t border-slate-100 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Application Submitted</p>
              <p className="text-[10px] text-slate-400">Identity details & bank settlement account captured</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === 'APPROVED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : status === 'REJECTED' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">Document Verification</p>
              <p className="text-[10px] text-slate-400">PAN & Banking authenticity validation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status === 'APPROVED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">Direct Cockpit Activation</p>
              <p className="text-[10px] text-slate-400">Ready to accept appointments and earn payouts</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      {status === 'APPROVED' ? (
        <button
          onClick={onOpenCockpit}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Launch Provider Cockpit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : status === 'REJECTED' ? (
        <button
          onClick={onResubmit}
          className="w-full py-3 rounded-2xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <RefreshCw className="w-4 h-4 text-brand-400" />
          <span>Resubmit Documents</span>
        </button>
      ) : (
        <button
          onClick={onOpenCockpit}
          className="w-full py-3 rounded-2xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <span>Explore Cockpit (Preview Mode)</span>
          <ArrowRight className="w-4 h-4 text-brand-400" />
        </button>
      )}
    </div>
  );
};

