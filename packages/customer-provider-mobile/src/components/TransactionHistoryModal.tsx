import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { FaFileInvoice, FaCheckCircle, FaCoins, FaTimes } from './FontAwesomeIcons';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewInvoice?: (booking: any) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewInvoice,
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getCustomerTransactions();
      setTransactions(res?.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFCF4] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaCoins size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Payment & Transaction History</h3>
              <p className="text-[11px] text-[#4B5563]">Receipts and settlement records</p>
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
            <div className="py-12 text-center text-xs text-[#6B7280]">Loading transaction records...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              <p className="font-semibold text-sm text-[#111111] mb-1">No Transactions Found</p>
              <p>When you book services, payment records and receipts will appear here.</p>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <div
                key={tx.id}
                className="p-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#65B32E] bg-[#EFF8E7] px-2 py-0.5 rounded-full">
                      {tx.bookingRef || 'REF-' + tx.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#111111] mt-1.5">{tx.serviceName}</h4>
                    <p className="text-xs text-[#4B5563] font-medium">{tx.providerName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#111111]">₹{tx.amount}</div>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]">
                      {tx.paymentStatus || 'PAID'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F2EFE8] flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>{tx.date} at {tx.time} • {tx.paymentMethod}</span>
                  {onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(tx)}
                      className="text-[#65B32E] hover:text-[#529624] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <FaFileInvoice size={12} />
                      <span>Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
