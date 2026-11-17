import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { FaHeart, FaMapMarkerAlt, FaTimes } from './FontAwesomeIcons';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: any) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProvider,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const [favRes, provRes] = await Promise.all([
        mobileApi.getCustomerFavorites().catch(() => ({ data: [] })),
        mobileApi.getProviders().catch(() => ({ data: [] })),
      ]);
      const ids = favRes?.data || [];
      setFavoriteIds(ids);
      const allProviders = provRes?.data || [];
      const filtered = allProviders.filter((p: any) => ids.includes(p.id));
      setProviders(filtered);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFav = async (pId: string) => {
    try {
      const res = await mobileApi.toggleCustomerFavorite(pId);
      if (res?.data) {
        setFavoriteIds(res.data);
        setProviders((prev) => prev.filter((p) => res.data.includes(p.id)));
      }
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFCF4] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaHeart size={15} color="#65B32E" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">Favourite Providers</h3>
              <p className="text-[11px] text-[#4B5563]">Your saved specialists for quick rebooking</p>
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
        <div className="p-5 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">Loading favourite specialists...</div>
          ) : providers.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280] space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#EFF8E7] text-[#65B32E] flex items-center justify-center mx-auto text-xl">
                ♡
              </div>
              <p className="font-bold text-sm text-[#111111]">No Favourites Saved Yet</p>
              <p>Tap the heart icon on any specialist card to save them here for quick access.</p>
            </div>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white border border-[#E8E4D9] rounded-2xl shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-extrabold text-sm text-[#111111]">{p.businessName || p.fullName}</h4>
                  <p className="text-xs text-[#4B5563] mt-0.5">{p.categoryName || 'Service Provider'}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-1">
                    <FaMapMarkerAlt size={10} color="#65B32E" />
                    <span>{p.city || 'Warangal'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFav(p.id)}
                    className="p-2 rounded-full bg-[#EFF8E7] text-[#DC2626] cursor-pointer hover:bg-red-50"
                  >
                    <FaHeart size={14} color="#DC2626" />
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectProvider(p);
                    }}
                    className="px-3.5 py-1.5 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Book
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
