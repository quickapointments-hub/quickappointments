import React, { useState, useEffect } from 'react';
import { mobileApi } from '../api';
import { FaImages, FaPlus, FaTimes } from './FontAwesomeIcons';

interface ProviderGalleryModalProps {
  providerId: string;
  providerName?: string;
  isOpen: boolean;
  isProviderOwner?: boolean;
  onClose: () => void;
}

export const ProviderGalleryModal: React.FC<ProviderGalleryModalProps> = ({
  providerId,
  providerName = 'Specialist Portfolio',
  isOpen,
  isProviderOwner = false,
  onClose,
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && providerId) {
      loadGallery();
    }
  }, [isOpen, providerId]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const res = await mobileApi.getProviderGallery(providerId);
      setImages(res?.data || []);
    } catch {
      setImages([
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    try {
      setAdding(true);
      const res = await mobileApi.addProviderGalleryImage(newImageUrl.trim());
      if (res?.data) {
        setImages(res.data);
        setNewImageUrl('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add image');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EFF8E7] flex items-center justify-center text-[#65B32E]">
              <FaImages size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#111111]">{providerName} — Work Gallery</h3>
              <p className="text-[11px] text-[#4B5563]">Real work portfolio & service photos</p>
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
          {isProviderOwner && (
            <div className="bg-white p-3.5 rounded-2xl border border-[#E8E4D9] space-y-2">
              <span className="text-xs font-bold text-[#111111]">Add New Portfolio Photo</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#FFFFFF] border border-[#E8E4D9] rounded-xl text-xs text-[#111111] focus:outline-none focus:border-[#65B32E]"
                />
                <button
                  disabled={adding || !newImageUrl.trim()}
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">Loading gallery images...</div>
          ) : images.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6B7280]">No photos uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-[#E8E4D9] shadow-xs group relative"
                >
                  <img
                    src={img}
                    alt={`Work photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
