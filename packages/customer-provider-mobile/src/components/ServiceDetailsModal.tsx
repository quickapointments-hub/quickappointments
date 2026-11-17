import React from 'react';
import { Clock as FaClock, CheckCircle2 as FaCheckCircle, X as FaTimes } from 'lucide-react';

interface ServiceDetailsModalProps {
  service: any;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: any) => void;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FDFCF4] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Hero Image */}
        <div className="relative h-48 w-full bg-gray-100">
          <img
            src={
              service.imageUrl ||
              'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80'
            }
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#111111] shadow-md hover:bg-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#65B32E] uppercase tracking-wider bg-[#EFF8E7] px-2 py-0.5 rounded-full">
                {service.categoryName || 'Beauty & Wellness'}
              </span>
              <h2 className="text-xl font-extrabold text-[#111111] mt-1.5">{service.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#4B5563]">
                <FaClock size={12} color="#65B32E" />
                <span>{service.duration || `${service.durationMinutes || 45} mins`}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#111111]">₹{service.price || service.basePrice}</span>
              <p className="text-[10px] text-[#6B7280]">Inclusive of all taxes</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E8E4D9] space-y-2">
            <h4 className="text-xs font-bold text-[#111111]">Service Overview</h4>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              {service.description ||
                'Comprehensive expert appointment service conducted by certified and verified background-checked professionals using sanitized and premium materials.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#111111]">What’s Included</h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-[#4B5563]">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#E8E4D9]">
                <FaCheckCircle size={14} color="#65B32E" />
                <span>Consultation & professional requirement analysis</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#E8E4D9]">
                <FaCheckCircle size={14} color="#65B32E" />
                <span>Premium sanitized tools & brand products</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#E8E4D9]">
                <FaCheckCircle size={14} color="#65B32E" />
                <span>Post-service cleanup & customer satisfaction guarantee</span>
              </div>
            </div>
          </div>

          {/* Book Action */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onBookNow(service);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#65B32E] hover:bg-[#529624] text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Book Appointment • ₹{service.price || service.basePrice}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
