import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { FaWallet, FaCoins, FaCheckCircle, FaTimes, FaPlus } from './FontAwesomeIcons';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const [balance, setBalance] = useState<number>(250);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState<string>('500');
  const [isAdding, setIsAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWallet();
    }
  }, [isOpen]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getCustomerWallet();
      if (res?.data) {
        setBalance(res.data.balance || 0);
        setTransactions(res.data.transactions || []);
      }
    } catch {
      // Fallback
      setBalance(250);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (amt: number) => {
    try {
      setIsAdding(true);
      setSuccessMsg(null);
      const res = await mobileApi.addCustomerWalletFunds(amt, 'UPI');
      if (res?.data) {
        setBalance(res.data.balance);
        setTransactions(res.data.transactions || []);
        setSuccessMsg(`₹${amt} added successfully to your Quick Appointments Wallet!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add funds');
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaWallet size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Quick Appointments Wallet</h3>
              <p className="text-[11px] text-[#4B5563]">Instant booking checkout & instant refunds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Balance Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1B3808] to-[#2D5A12] text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-white">
              <FaWallet size={120} />
            </div>
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider text-[#A5D6A7] font-semibold">Available Balance</span>
              <div className="text-3xl font-black mt-1">₹{balance.toLocaleString()}</div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-[#EFF8E7]">
                <FaCheckCircle size={13} color="#86EFAC" />
                <span>Auto-applied at appointment checkout</span>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl text-xs text-[#16A34A] font-semibold flex items-center gap-2">
              <FaCheckCircle size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add Funds Section */}
          <div className="bg-white p-4 rounded-2xl border border-[#E8E4D9] space-y-3">
            <span className="text-xs font-bold text-[#111111]">Top-up Wallet</span>
            <div className="flex gap-2">
              {[200, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAddAmount(String(val))}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    addAmount === String(val)
                      ? 'border-[#65B32E] bg-[#EFF8E7] text-[#1B3808]'
                      : 'border-[#E8E4D9] bg-white text-[#4B5563] hover:border-gray-400'
                  }`}
                >
                  +₹{val}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-[#4B5563]">₹</span>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#FFFFFF] border border-[#E8E4D9] rounded-xl text-sm font-bold text-[#111111] focus:outline-none focus:border-[#65B32E]"
                  placeholder="Enter amount"
                />
              </div>
              <button
                disabled={isAdding || !Number(addAmount)}
                onClick={() => handleAddFunds(Number(addAmount))}
                className="px-5 py-2.5 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Add Cash'}
              </button>
            </div>
          </div>

          {/* Transaction History Ledger */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#111111]">Recent Activity</span>
            {loading ? (
              <div className="py-6 text-center text-xs text-[#6B7280]">Loading ledger...</div>
            ) : transactions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#6B7280]">No wallet transactions yet.</div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-white border border-[#E8E4D9] rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#111111]">{tx.description || 'Wallet Credit'}</p>
                      <p className="text-[10px] text-[#6B7280]">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-extrabold text-[#16A34A]">+₹{tx.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
