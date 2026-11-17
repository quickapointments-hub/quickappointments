import React from 'react';
import { QuickAppointmentsLogo } from './QuickAppointmentsLogo';
import { FaFileInvoice, FaCheckCircle, FaTimes } from './FontAwesomeIcons';

interface BookingInvoiceModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingInvoiceModal: React.FC<BookingInvoiceModalProps> = ({
  booking,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !booking) return null;

  const total = Number(booking.totalAmount || booking.amount || booking.servicePrice || 499);
  const tax = Math.round(total * 0.18);
  const base = Math.max(0, total - tax);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#E8E4D9]">
        {/* Modal Top Bar */}
        <div className="p-4 px-5 border-b border-[#E8E4D9] flex items-center justify-between bg-[#FDFCF4] print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
            <FaFileInvoice size={16} color="#65B32E" />
            <span>Official Booking Tax Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#65B32E] hover:bg-[#529624] text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-[#E8E4D9] flex items-center justify-center text-[#4B5563] hover:text-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#111111] bg-white text-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E8E4D9] pb-4">
            <div>
              <QuickAppointmentsLogo className="h-9 w-auto mb-1.5" />
              <p className="text-[11px] text-[#4B5563]">Quick Appointments India Pvt. Ltd.</p>
              <p className="text-[11px] text-[#4B5563]">GSTIN: 36AAACQ1234F1Z5</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-[#111111]">TAX INVOICE</span>
              <p className="font-mono text-[11px] font-bold text-[#65B32E] mt-0.5">
                {booking.bookingRef || `REF-${(booking.id || '2026').slice(0, 8).toUpperCase()}`}
              </p>
              <p className="text-[10px] text-[#6B7280] mt-1">Date: {booking.date || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-2 gap-4 bg-[#FDFCF4] p-4 rounded-xl border border-[#E8E4D9]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">Customer Details</span>
              <p className="font-bold text-sm text-[#111111] mt-0.5">{booking.customerName || 'Registered Customer'}</p>
              <p className="text-[11px] text-[#4B5563]">{booking.customerPhone || '+91 Mobile User'}</p>
              <p className="text-[11px] text-[#4B5563]">{booking.address || 'Service Location'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">Service Provider</span>
              <p className="font-bold text-sm text-[#111111] mt-0.5">{booking.providerName || booking.provider?.businessName || 'Verified Specialist'}</p>
              <p className="text-[11px] text-[#4B5563]">Quick Appointments Verified Partner</p>
              <p className="text-[11px] text-[#4B5563]">Schedule: {booking.startTime || '10:00 AM'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#E8E4D9] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F0] border-b border-[#E8E4D9] text-[#4B5563]">
                <tr>
                  <th className="p-3">Service Description</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE8]">
                <tr>
                  <td className="p-3 font-semibold text-[#111111]">
                    {booking.serviceName || booking.service?.name || 'Appointment Service'}
                  </td>
                  <td className="p-3 text-center text-[#4B5563]">{booking.duration || '45 mins'}</td>
                  <td className="p-3 text-right font-bold text-[#111111]">₹{base}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4B5563]">
                <span>Base Price:</span>
                <span>₹{base}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>GST (18%):</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-[#4B5563]">
                <span>Platform Discount:</span>
                <span className="text-[#16A34A]">-₹0</span>
              </div>
              <div className="pt-2 border-t border-[#E8E4D9] flex justify-between font-black text-sm text-[#111111]">
                <span>Total Paid:</span>
                <span>₹{total}</span>
              </div>
              <div className="text-[10px] text-right text-[#16A34A] font-bold">
                Payment: {booking.paymentMethod || 'CASH_ON_SERVICE'} ({booking.paymentStatus || 'PAID'})
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#E8E4D9] pt-4 text-center text-[10px] text-[#6B7280]">
            <p>This is a computer-generated invoice and requires no physical signature.</p>
            <p className="mt-0.5">Quick Appointments • Thank you for choosing verified local specialists!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
