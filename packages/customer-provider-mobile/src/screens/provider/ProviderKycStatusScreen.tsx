import React, { useState, useEffect, useCallback } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Bell,
  ShieldAlert,
} from 'lucide-react';

type VerificationState = 'PENDING' | 'UNDER_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED';

interface ProviderKycStatusScreenProps {
  status?: VerificationState;
  rejectionReason?: string | null;
  onOpenCockpit: () => void;
  onResubmit?: () => void;
}

export const ProviderKycStatusScreen: React.FC<ProviderKycStatusScreenProps> = ({
  status: initialStatus = 'PENDING',
  rejectionReason: initialRejectionReason,
  onOpenCockpit,
  onResubmit,
}) => {
  const { user, refreshProfile } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<VerificationState>(initialStatus);
  const [currentReason, setCurrentReason] = useState<string | null | undefined>(initialRejectionReason);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  const syncLiveStatus = useCallback(async () => {
    if (!user?.id && !user?.phone) return;
    try {
      setChecking(true);
      const [kyc, notifRes] = await Promise.all([
        mobileApi.getProviderKycStatus(user?.id, user?.phone),
        mobileApi.getNotifications(user?.id).catch(() => ({ data: [] })),
      ]);

      if (kyc?.verificationStatus) {
        setCurrentStatus(kyc.verificationStatus as VerificationState);
        setCurrentReason(kyc.rejectionReason || null);
      }
      if (Array.isArray(notifRes?.data)) {
        setNotifications(notifRes.data.slice(0, 5));
      }
      await refreshProfile();
    } catch (e) {
      console.warn('Provider KYC live status check error:', e);
    } finally {
      setChecking(false);
    }
  }, [user?.id, user?.phone, refreshProfile]);

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setCurrentReason(initialRejectionReason);
  }, [initialRejectionReason]);

  useEffect(() => {
    syncLiveStatus();

    const unsubscribeSync = mobileApi.subscribeToSync((event, payload) => {
      if (event === 'provider_kyc_updated' || event === 'providers_updated') {
        if (payload?.userId && user?.id && payload.userId !== user.id) return;
        syncLiveStatus();
      }
    });

    const channel = supabase
      .channel(`kyc-status-live-${user?.id || 'anon'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_profiles' }, (payload: any) => {
        if (payload.new && (!user?.id || payload.new.user_id === user.id)) {
          const nextStatus = (payload.new.verification_status || 'PENDING') as VerificationState;
          setCurrentStatus(nextStatus);
          setCurrentReason(payload.new.rejection_reason || null);
          syncLiveStatus();
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        syncLiveStatus();
      })
      .subscribe();

    const interval = setInterval(syncLiveStatus, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeSync();
      supabase.removeChannel(channel);
    };
  }, [user?.id, syncLiveStatus]);

  const isApproved = currentStatus === 'APPROVED';
  const isRejected = currentStatus === 'REJECTED';
  const needsInfo = currentStatus === 'NEEDS_INFO';

  return (
    <div className="pb-24 px-5 pt-6 space-y-5 bg-[#FDFCF4] min-h-full">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold text-[#65B32E] uppercase tracking-wider">
          Provider Verification Gate
        </span>
        <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight">
          Application Status
        </h2>
        <p className="text-xs text-slate-500">
          {user?.providerProfile?.businessName || user?.fullName} • Real-Time KYC Tracker
        </p>
      </div>

      {/* Main Status Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8E4D9] shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner">
          {isApproved ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : isRejected ? (
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : needsInfo ? (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}
        </div>

        <div>
          <span
            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800'
                : isRejected
                ? 'bg-rose-100 text-rose-800'
                : needsInfo
                ? 'bg-orange-100 text-orange-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {currentStatus}
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {isApproved
              ? 'Verification Approved!'
              : isRejected
              ? 'Application Rejected'
              : needsInfo
              ? 'Document Clarity Required'
              : 'Pending Admin Approval'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
            {isApproved
              ? 'Your Service Provider account has been verified and activated. You can now go live and accept customer appointments.'
              : isRejected
              ? currentReason || 'Your provider application could not be approved. Review the rejection notice below and contact support or resubmit.'
              : needsInfo
              ? currentReason || 'Admin requested clearer HD copies of your verification documents.'
              : 'Your documents are saved in our database and waiting for Admin review. Accepting bookings is locked until approval is granted.'}
          </p>
        </div>

        {(isRejected || needsInfo) && currentReason && (
          <div
            className={`p-3 rounded-2xl text-left text-xs border ${
              isRejected ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Admin Note:</span>
            </p>
            <p className="text-[11px] leading-relaxed">{currentReason}</p>
          </div>
        )}

        {/* Stepper progress */}
        <div className="pt-4 border-t border-slate-100 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Registration & Documents Saved</p>
              <p className="text-[10px] text-slate-400">Submitted to Quick Appointments Admin queue</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : isRejected || needsInfo ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">Admin KYC Verification</p>
              <p className="text-[10px] text-slate-400">
                {isApproved ? 'Documents & premises approved' : isRejected ? 'Rejected by Admin' : needsInfo ? 'Waiting for re-upload' : 'Under compliance review'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold text-slate-900">Accept Customer Bookings</p>
              <p className="text-[10px] text-slate-400">
                {isApproved ? 'Unlocked — visible in customer search' : 'Locked until Admin approval'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications from Admin */}
      {notifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-[#E8E4D9] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Bell className="w-4 h-4 text-[#65B32E]" />
            <span>Status Notifications</span>
          </div>
          {notifications.map((n: any) => (
            <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <p className="font-bold text-slate-900">{n.title}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strict Gated Action Buttons (No bypass preview for unapproved providers) */}
      {isApproved ? (
        <button
          onClick={onOpenCockpit}
          className="w-full py-3.5 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <span>Launch Provider Cockpit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : isRejected || needsInfo ? (
        <div className="space-y-2.5">
          <button
            onClick={onResubmit}
            className="w-full py-3.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-Upload Clear HD Documents</span>
          </button>
          <button
            onClick={syncLiveStatus}
            disabled={checking}
            className="w-full py-3 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Check Updated Status'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={syncLiveStatus}
          disabled={checking}
          className="w-full py-3.5 rounded-full bg-white hover:bg-slate-50 border border-[#65B32E] text-[#15803D] text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Checking Live Status...' : 'Refresh Approval Status'}</span>
        </button>
      )}
    </div>
  );
};
