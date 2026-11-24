import React, { useState } from 'react';
import { FaTimes, FaCheckCircle } from './FontAwesomeIcons';

interface FAQsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQS_DATA = [
  {
    q: 'How do I book an appointment?',
    a: 'Browse through categories, select your preferred service and verified specialist, choose an available date and time slot, and confirm via Cash on Service or online payment.',
  },
  {
    q: 'What is the Quick Appointments 48-Hour Refund Guarantee?',
    a: 'If an appointment is cancelled by the specialist or if you cancel eligible advance bookings, refunds are processed within 24–48 hours back to your original payment method or instantly to your Quick Appointments Wallet.',
  },
  {
    q: 'How does the Service Verification OTP work?',
    a: 'For your security, a 4-digit or 6-digit OTP is shown on your booking details card. Share this code with the specialist ONLY when they arrive and start your service.',
  },
  {
    q: 'Can I reschedule an upcoming appointment?',
    a: 'Yes! Open the Appointments tab, tap "Reschedule" on your upcoming booking, and select any alternative open time slot at zero extra charge.',
  },
  {
    q: 'Are all service providers background checked?',
    a: 'All specialists on Quick Appointments undergo strict KYC identity verification (Aadhaar, PAN, and trade licensing) before being approved by our operations team.',
  },
];

export const FAQsModal: React.FC<FAQsModalProps> = ({ isOpen, onClose }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] w-full max-w-md rounded-t-[32px] sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-white">
          <div>
            <h3 className="font-extrabold text-sm text-[#111111]">Frequently Asked Questions</h3>
            <p className="text-[11px] text-[#4B5563]">Instant answers to common booking queries</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          {FAQS_DATA.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E8E4D9] rounded-2xl overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-xs text-[#111111] flex items-center justify-between cursor-pointer"
              >
                <span>{item.q}</span>
                <span className="text-[#65B32E] text-base font-bold ml-2">
                  {openIdx === idx ? '−' : '+'}
                </span>
              </button>
              {openIdx === idx && (
                <div className="p-4 pt-0 text-xs text-[#4B5563] leading-relaxed border-t border-[#F2EFE8]">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
