import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { Plus, CheckCircle2, X } from 'lucide-react';

interface ProviderAddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProviderAddServiceModal: React.FC<ProviderAddServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isCustomService, setIsCustomService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDuration, setCustomDuration] = useState('45');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      setIsCustomService(false);
      setCustomName('');
      setCustomDesc('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      const [catRes, srvRes] = await Promise.all([
        mobileApi.getCategories().catch(() => ({ data: [] })),
        mobileApi.getServices().catch(() => ({ data: [] })),
      ]);
      const catList = catRes?.data || [];
      const srvList = srvRes?.data || [];
      setCategories(catList);
      setServices(srvList);
      if (catList.length > 0) {
        setSelectedCatId(catList[0].id);
      }
    } catch (e: any) {
      console.warn('Catalog load error in ProviderAddServiceModal:', e);
    }
  };

  const filteredServices = services.filter(
    (s) => !selectedCatId || s.categoryId === selectedCatId || s.category_id === selectedCatId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const priceNum = Number(customPrice);
    if (!priceNum || priceNum <= 0) {
      setErrorMsg('Please enter a valid positive price in ₹');
      return;
    }

    if (!isCustomService && !selectedServiceId) {
      setErrorMsg('Please select a service from catalog or switch to custom item');
      return;
    }

    if (isCustomService && !customName.trim()) {
      setErrorMsg('Please enter a custom service name');
      return;
    }

    try {
      setSubmitting(true);
      await mobileApi.submitProviderService({
        categoryId: selectedCatId,
        serviceId: isCustomService ? undefined : selectedServiceId,
        name: isCustomService ? customName.trim() : undefined,
        description: isCustomService ? customDesc.trim() : undefined,
        customPrice: priceNum,
        customDuration: Number(customDuration) || 45,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit service');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Offer New Service / Dish</h3>
              <p className="text-[11px] text-[#4B5563]">Partner workflow with Admin review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {success && (
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] text-[#16A34A] rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Service submitted! Waiting for Admin verification before going live.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
              <X className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Category Selection */}
          <div className="space-y-1">
            <label className="font-bold text-[#111111]">Select Category *</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl font-medium text-[#111111] focus:outline-none focus:border-[#65B32E]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switch: Standard Catalog Service vs Custom Service */}
          <div className="flex items-center gap-2 p-1 bg-[#FFFFFF] rounded-xl">
            <button
              type="button"
              onClick={() => setIsCustomService(false)}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${!isCustomService ? 'bg-white text-[#111111] shadow-xs' : 'text-[#4B5563]'
                }`}
            >
              Catalog Service
            </button>
            <button
              type="button"
              onClick={() => setIsCustomService(true)}
              className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${isCustomService ? 'bg-[#65B32E] text-white shadow-xs' : 'text-[#4B5563]'
                }`}
            >
              + Custom Service
            </button>
          </div>

          {!isCustomService ? (
            <div className="space-y-1">
              <label className="font-bold text-[#111111]">Select Standard Service *</label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  const s = services.find((x) => x.id === e.target.value);
                  if (s) {
                    setCustomPrice(String(s.basePrice || s.base_price || 499));
                    setCustomDuration(String(s.durationMinutes || s.duration_minutes || 45));
                  }
                }}
                className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl font-medium text-[#111111] focus:outline-none focus:border-[#65B32E]"
                required={!isCustomService}
              >
                <option value="">-- Choose Standard Catalog Service --</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Base Catalog: ₹{s.basePrice || s.base_price || 499})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 bg-[#FFFFFF] p-3 rounded-2xl border border-[#E8E4D9]">
              <div className="space-y-1">
                <label className="font-bold text-[#111111]">Custom Service Name *</label>
                <input
                  type="text"
                  required={isCustomService}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Deluxe Bridal Facial & Glow"
                  className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl font-semibold text-[#111111] focus:outline-none focus:border-[#65B32E]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#111111]">Service Description</label>
                <textarea
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What is included in this service?"
                  className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#65B32E]"
                />
              </div>
            </div>
          )}

          {/* Pricing & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#111111]">Your Price (₹) *</label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="499"
                className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl font-bold text-[#111111] focus:outline-none focus:border-[#65B32E]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#111111]">Duration (Mins) *</label>
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="45"
                className="w-full p-2.5 bg-white border border-[#E8E4D9] rounded-xl font-bold text-[#111111] focus:outline-none focus:border-[#65B32E]"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-[#EFF8E7] rounded-xl border border-[#65B32E]/20 text-[11px] text-[#2C481A] space-y-1">
            <p className="font-bold">Two-Tier Governance (Partner Flow):</p>
            <p>
              Your custom service and rate card will be placed in the Admin Review queue. Once approved by the operations team, it instantly goes live for customers to book in the app.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting to Admin...' : 'Submit Service for Review'}
          </button>
        </form>
      </div>
    </div>
  );
};
