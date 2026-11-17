import React from 'react';
import { FaCheckCircle, FaClock, FaTimes, FaCoins } from './FontAwesomeIcons';

interface RefundStatusModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export const RefundStatusModal: React.FC<RefundStatusModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  const refundAmt = booking.totalAmount || booking.servicePrice || 499;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFCF4] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaCoins size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Refund Status & Timeline</h3>
              <p className="text-[11px] text-[#4B5563]">Quick Appointments 48-Hour Refund Guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F0] border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#E8E4D9] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Refund Amount</span>
              <div className="text-2xl font-black text-[#111111] mt-0.5">₹{refundAmt}</div>
              <p className="text-[11px] text-[#4B5563]">Ref: REF-{booking.id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF8E7] text-[#1B3808] border border-[#86EFAC]">
              Processing (Within 48h)
            </span>
          </div>

          {/* Timeline Stages */}
          <div className="p-5 bg-white rounded-2xl border border-[#E8E4D9] space-y-6">
            {/* Step 1 */}
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-[#65B32E] text-white flex items-center justify-center shrink-0 z-10 text-[11px] font-bold">
                ✓
              </div>
              <div className="absolute top-6 left-3 w-0.5 h-12 bg-[#86EFAC]" />
              <div>
                <p className="text-xs font-bold text-[#111111]">Refund Initiated</p>
                <p className="text-[11px] text-[#4B5563] mt-0.5">Cancellation confirmed by system</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-[#65B32E] text-white flex items-center justify-center shrink-0 z-10 text-[11px] font-bold">
                ✓
              </div>
              <div className="absolute top-6 left-3 w-0.5 h-12 bg-gray-200" />
              <div>
                <p className="text-xs font-bold text-[#111111]">Payment Gateway Approval</p>
                <p className="text-[11px] text-[#4B5563] mt-0.5">Bank processing initiated</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 relative">
              <div className="w-6 h-6 rounded-full bg-[#EFF8E7] text-[#65B32E] border-2 border-[#65B32E] flex items-center justify-center shrink-0 z-10 text-[11px] font-bold animate-pulse">
                •
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111]">Credit to Original Payment Source</p>
                <p className="text-[11px] text-[#4B5563] mt-0.5">Expected within 2-3 business days</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F0] rounded-xl border border-[#E8E4D9] text-xs text-[#4B5563] flex items-start gap-2">
            <FaClock size={14} color="#65B32E" className="mt-0.5 shrink-0" />
            <span>
              If you used Quick Appointments Wallet, funds are credited instantly. Bank and UPI refunds take 24–48 hours depending on your bank's settlement cycle.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
