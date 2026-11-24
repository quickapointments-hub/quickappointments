import React, { useState, useEffect, useMemo } from 'react';
import { mobileApi } from '../../api';
import { supabase } from '../../supabase';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Trash2,
  Info,
} from 'lucide-react';
import { ProviderAddServiceModal } from '../../components/ProviderAddServiceModal';

interface ProviderServicesScreenProps {
  onBack?: () => void;
}

export const ProviderServicesScreen: React.FC<ProviderServicesScreenProps> = ({ onBack }) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();

    const channel = supabase
      .channel('provider-my-services-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_service_rates' }, () => {
        loadServices();
      })
      .subscribe();

    const unsub = mobileApi.subscribeToSync((ev) => {
      if (ev === 'rates_updated' || ev === 'catalog_updated') {
        loadServices();
      }
    });

    return () => {
      supabase.removeChannel(channel);
      unsub();
    };
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getProviderServices();
      setServices(res?.data || []);
    } catch (err) {
      console.warn('Failed to load provider services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rateId: string) => {
    if (!confirm('Remove this service from your menu?')) return;
    try {
      setDeletingId(rateId);
      await mobileApi.deleteProviderService(rateId);
      setServices((prev) => prev.filter((s) => s.id !== rateId));
    } catch (err: any) {
      alert(err.message || 'Failed to remove service');
    } finally {
      setDeletingId(null);
    }
  };

  const pendingCount = services.filter((s) => s.approvalStatus === 'PENDING').length;
  const approvedCount = services.filter((s) => s.approvalStatus === 'APPROVED').length;
  const rejectedCount = services.filter((s) => s.approvalStatus === 'REJECTED').length;

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return services;
    return services.filter((s) => s.approvalStatus === activeTab);
  }, [services, activeTab]);

  return (
    <div className="relative min-h-full h-full flex flex-col bg-[#FFFFFF] text-[#111111]">
      {/* Top Header */}
      <div className="p-4 px-5 border-b border-[#E8E4D9] bg-white flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] flex items-center justify-center text-[#111111] hover:bg-[#FFFFFF] cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-extrabold text-[#111111]">My Services & Menu</h1>
            <p className="text-[11px] text-[#4B5563]">Manage catalog pricing & custom offerings</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Service</span>
        </button>
      </div>

      {/* KPI Cards (Partner Overview) */}
      <div className="p-4 grid grid-cols-3 gap-2">
        <div
          onClick={() => setActiveTab('APPROVED')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${activeTab === 'APPROVED' ? 'bg-[#EFF8E7] border-[#65B32E]' : 'bg-white border-[#E8E4D9]'
            }`}
        >
          <span className="text-[10px] font-bold text-[#4B5563] block">Live & Active</span>
          <span className="text-lg font-black text-[#65B32E] block mt-0.5">{approvedCount}</span>
        </div>

        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${activeTab === 'PENDING' ? 'bg-amber-50 border-amber-400' : 'bg-white border-[#E8E4D9]'
            }`}
        >
          <span className="text-[10px] font-bold text-[#4B5563] block">Under Review</span>
          <span className="text-lg font-black text-amber-600 block mt-0.5">{pendingCount}</span>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${activeTab === 'REJECTED' ? 'bg-rose-50 border-rose-400' : 'bg-white border-[#E8E4D9]'
            }`}
        >
          <span className="text-[10px] font-bold text-[#4B5563] block">Rejected</span>
          <span className="text-lg font-black text-rose-600 block mt-0.5">{rejectedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-2xl text-[11px] font-bold">
          {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all cursor-pointer ${activeTab === tab ? 'bg-white text-[#111111] shadow-xs' : 'text-[#4B5563]'
                }`}
            >
              {tab === 'ALL'
                ? `All (${services.length})`
                : tab === 'APPROVED'
                  ? `Live (${approvedCount})`
                  : tab === 'PENDING'
                    ? `Review (${pendingCount})`
                    : `Action (${rejectedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-12 text-xs text-[#6B7280]">Loading services...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-[#E8E4D9] p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EFF8E7] text-[#65B32E] flex items-center justify-center mx-auto">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#111111]">No services found</h3>
              <p className="text-xs text-[#4B5563] mt-1">
                {activeTab === 'PENDING'
                  ? 'No services currently under Admin review.'
                  : activeTab === 'APPROVED'
                    ? 'No approved services yet. Add your first service!'
                    : 'Start adding services to accept customer bookings.'}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-full bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-sm"
            >
              + Add New Service
            </button>
          </div>
        ) : (
          filtered.map((s) => {
            const isApproved = s.approvalStatus === 'APPROVED';
            const isPending = s.approvalStatus === 'PENDING';
            const isRejected = s.approvalStatus === 'REJECTED';

            return (
              <div
                key={s.id || s.rateId}
                className="bg-white rounded-3xl p-4 border border-[#E8E4D9] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {s.imageUrl && (
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E8E4D9] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] text-[10px] font-bold text-[#4B5563]">
                          {s.categoryName || 'General'}
                        </span>
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full bg-[#EFF8E7] text-[#65B32E] text-[10px] font-bold border border-[#65B32E]/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Live in App</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Under Review</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-sm text-[#111111] mt-1.5">{s.name}</h3>
                      {s.description && (
                        <p className="text-[11px] text-[#4B5563] line-clamp-2 mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-xl text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Remove Service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#FFFFFF] text-xs">
                  <div className="flex items-center gap-3">
                    <div className="font-mono">
                      <span className="text-[10px] text-[#6B7280] block">Your Rate</span>
                      <span className="font-black text-[#111111] text-sm">₹{s.customPrice}</span>
                    </div>
                    <div className="font-mono">
                      <span className="text-[10px] text-[#6B7280] block">Duration</span>
                      <span className="font-bold text-[#4B5563]">{s.customDuration} mins</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl font-medium border border-amber-100 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      <span>Admin approval needed</span>
                    </div>
                  )}

                  {isApproved && (
                    <div className="text-[10px] text-[#65B32E] bg-[#EFF8E7] px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Customers can book now</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Service Modal */}
      <ProviderAddServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadServices();
          setActiveTab('PENDING');
        }}
      />
    </div>
  );
};