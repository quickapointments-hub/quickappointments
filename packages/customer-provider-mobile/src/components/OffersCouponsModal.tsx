import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { FaTicketAlt, FaCheckCircle, FaTimes } from './FontAwesomeIcons';

interface OffersCouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoupon?: (code: string) => void;
}

export const OffersCouponsModal: React.FC<OffersCouponsModalProps> = ({
  isOpen,
  onClose,
  onSelectCoupon,
}) => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCoupons();
    }
  }, [isOpen]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getOffers();
      setCoupons(res?.data || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    if (onSelectCoupon) {
      onSelectCoupon(code);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFCF4] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaTicketAlt size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Offers & Promotions</h3>
              <p className="text-[11px] text-[#4B5563]">Save on verified appointment bookings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F0] border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">Loading active deals...</div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">No active promotions right now.</div>
          ) : (
            coupons.map((c: any) => (
              <div
                key={c.id || c.code}
                className="p-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs space-y-2 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-black text-[#1B3808] bg-[#EFF8E7] border border-[#86EFAC] px-2.5 py-1 rounded-lg">
                      {c.code}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#111111] mt-2">
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.value}% OFF up to ₹${c.maxDiscountAmount || 200}`
                        : `Flat ₹${c.value} OFF`}
                    </h4>
                    <p className="text-xs text-[#4B5563] mt-0.5">
                      {c.description || `Valid on minimum booking of ₹${c.minOrderAmount || 0}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(c.code)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedCode === c.code ? 'Copied! ✓' : onSelectCoupon ? 'Apply' : 'Copy'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
