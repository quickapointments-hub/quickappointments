import React, { useState } from 'react';
import { FaFilter, FaCheckCircle, FaTimes } from './FontAwesomeIcons';

interface FilterSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: 'popular' | 'price_low' | 'price_high';
  currentPriceRange: 'all' | 'under_500' | '500_1000' | 'above_1000';
  verifiedOnly: boolean;
  onApply: (filters: {
    sort: 'popular' | 'price_low' | 'price_high';
    priceRange: 'all' | 'under_500' | '500_1000' | 'above_1000';
    verifiedOnly: boolean;
  }) => void;
}

export const FilterSortModal: React.FC<FilterSortModalProps> = ({
  isOpen,
  onClose,
  currentSort,
  currentPriceRange,
  verifiedOnly: initialVerified,
  onApply,
}) => {
  const [sort, setSort] = useState(currentSort);
  const [priceRange, setPriceRange] = useState(currentPriceRange);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerified);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaFilter size={15} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Filter & Sort Services</h3>
              <p className="text-[11px] text-[#4B5563]">Refine specialist listings and pricing</p>
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
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Sort Options */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#111111]">Sort By</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'popular', label: 'Popular' },
                { id: 'price_low', label: 'Price: Low' },
                { id: 'price_high', label: 'Price: High' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    sort === s.id
                      ? 'bg-[#EFF8E7] border-[#65B32E] text-[#1B3808]'
                      : 'bg-white border-[#E8E4D9] text-[#4B5563] hover:border-gray-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#111111]">Price Range</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under_500', label: 'Under ₹500' },
                { id: '500_1000', label: '₹500 - ₹1,000' },
                { id: 'above_1000', label: 'Above ₹1,000' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPriceRange(p.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left cursor-pointer ${
                    priceRange === p.id
                      ? 'bg-[#EFF8E7] border-[#65B32E] text-[#1B3808]'
                      : 'bg-white border-[#E8E4D9] text-[#4B5563] hover:border-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verified Only Toggle */}
          <div className="p-4 bg-white rounded-2xl border border-[#E8E4D9] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#111111]">Verified Specialists Only</p>
              <p className="text-[11px] text-[#4B5563]">Show only background-verified professionals</p>
            </div>
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                verifiedOnly ? 'bg-[#65B32E]' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  verifiedOnly ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                setSort('popular');
                setPriceRange('all');
                setVerifiedOnly(false);
              }}
              className="flex-1 py-3 rounded-xl border border-[#E8E4D9] bg-white text-xs font-bold text-[#4B5563] hover:bg-gray-50 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onApply({ sort, priceRange, verifiedOnly });
                onClose();
              }}
              className="flex-2 py-3 rounded-xl bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
