import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mobileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  Clock,
  Sparkles,
  Phone,
  User,
  Check,
  CheckCheck,
} from 'lucide-react';

export interface BookingChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'PROVIDER';
  message: string;
  createdAt: string;
}

const CUSTOMER_QUICK_PILLS = [
  '👋 I have arrived',
  '📍 Where is the exact location?',
  '💵 Please bring change for ₹500',
  '📞 Please call me when you reach',
];

const PROVIDER_QUICK_PILLS = [
  '🚗 I am on my way',
  '⏱️ Will reach in 10 minutes',
  '🔑 Please keep your 4-digit OTP ready',
  '🚪 I have arrived outside',
];

export const BookingChatDrawer: React.FC<BookingChatDrawerProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const { user, activeRole } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const bookingId = booking?.id || booking?.bookingRef || '';
  const isCustomer = activeRole === 'CUSTOMER';

  const partnerName = isCustomer
    ? booking?.provider?.businessName ||
      booking?.provider?.business_name ||
      booking?.provider?.user?.fullName ||
      booking?.providerName ||
      'Service Specialist'
    : booking?.customer?.user?.fullName ||
      booking?.customer?.fullName ||
      booking?.customerName ||
      'Customer';

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const res = await mobileApi.getBookingMessages(bookingId);
      if (Array.isArray(res?.data)) {
        setMessages(res.data);
      }
    } catch {
      // Fallback empty if first time
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 80);
    }
  }, [bookingId, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    loadMessages();

    // Listen for live realtime messages broadcast by the other party
    const unsubscribe = mobileApi.subscribeToSync((event, payload) => {
      if (
        event === 'booking_chat_message' &&
        payload &&
        (payload.bookingId === bookingId || payload.booking_id === bookingId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id,
              bookingId: payload.bookingId || payload.booking_id,
              senderId: payload.senderId || payload.sender_id,
              senderName: payload.senderName || payload.sender_name,
              senderRole: payload.senderRole || payload.sender_role,
              message: payload.message,
              createdAt: payload.createdAt || payload.created_at || new Date().toISOString(),
            },
          ];
        });
        setTimeout(() => scrollToBottom(true), 60);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, bookingId, loadMessages, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputText;
    const clean = raw.trim();
    if (!clean || !bookingId || sending) return;

    try {
      setSending(true);
      if (textToSend === undefined) {
        setInputText('');
      }

      // Optimistic message append
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        bookingId,
        senderId: user?.id || 'me',
        senderName: user?.fullName || (isCustomer ? 'Customer' : 'Provider'),
        senderRole: isCustomer ? 'CUSTOMER' : 'PROVIDER',
        message: clean,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => scrollToBottom(true), 40);

      const res = await mobileApi.sendBookingMessage(bookingId, clean);
      if (res?.data?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...res.data, id: res.data.id } : m))
        );
      }
    } catch (err: any) {
      console.warn('Send booking message warning:', err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const quickPills = isCustomer ? CUSTOMER_QUICK_PILLS : PROVIDER_QUICK_PILLS;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in select-none">
      <div className="bg-[#FFFFFF] text-[#111111] w-full max-w-md h-[92vh] sm:h-[620px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E8E4D9] animate-slide-up">
        {/* Top Header */}
        <div className="p-4 bg-white border-b border-[#E8E4D9] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#EFF8E7] border-2 border-[#16A34A] flex items-center justify-center text-[#16A34A] font-black text-sm">
                {partnerName.slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#16A34A] ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-[#111111] truncate">{partnerName}</h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#EFF8E7] text-[#16A34A] border border-[#16A34A]/30">
                  {isCustomer ? 'Specialist' : 'Customer'}
                </span>
              </div>
              <p className="text-[11px] text-[#4B5563] truncate font-medium">
                {booking?.service?.name || booking?.serviceName || 'Direct Booking Chat'} •{' '}
                <span className="font-mono font-bold text-[#111111]">
                  {booking?.bookingRef || `#${bookingId.slice(0, 8)}`}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] hover:bg-[#E8E4D9] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Security & Appointment Context Banner */}
        <div className="px-4 py-2 bg-[#F8FAF5] border-b border-[#E8E4D9] flex items-center justify-between text-[11px] text-[#4B5563]">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <span className="truncate">
              Scheduled: <strong>{booking?.date || booking?.scheduledDate || 'Today'}</strong> at{' '}
              <strong>{booking?.startTime || booking?.scheduledTime || 'Slot'}</strong>
            </span>
          </div>
          <span className="shrink-0 font-bold text-[#16A34A] bg-[#EFF8E7] px-2 py-0.5 rounded-full text-[10px]">
            Live Sync
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFFFF]">
          {loading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[#6B7280]">
              <div className="w-6 h-6 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Connecting to live chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 space-y-3 text-[#6B7280]">
              <div className="w-12 h-12 rounded-full bg-[#EFF8E7] text-[#16A34A] flex items-center justify-center border border-[#16A34A]/40">
                <MessageSquare className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-sm font-bold text-[#111111]">Direct In-Booking Conversation</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Coordinate directions, share arrival status, or ask service requirements directly with{' '}
                <strong className="text-[#111111]">{partnerName}</strong>.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine =
                (isCustomer && m.senderRole === 'CUSTOMER') ||
                (!isCustomer && m.senderRole === 'PROVIDER') ||
                m.senderId === user?.id;

              const timeStr = m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <span className="text-[10px] text-[#6B7280] font-semibold px-1">
                    {isMine ? 'You' : m.senderName}
                  </span>

                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs font-medium leading-relaxed break-words ${
                      isMine
                        ? 'bg-[#16A34A] text-white rounded-tr-none'
                        : 'bg-white text-[#111111] border border-[#E8E4D9] rounded-tl-none'
                    }`}
                  >
                    <p>{m.message}</p>
                    <div
                      className={`text-[9px] mt-1 flex items-center gap-1 justify-end font-mono ${
                        isMine ? 'text-white/80' : 'text-[#6B7280]'
                      }`}
                    >
                      <span>{timeStr}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-white/90" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Response Pills */}
        <div className="p-2.5 bg-white border-t border-[#E8E4D9] overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#16A34A] shrink-0 ml-1" />
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(pill)}
              className="px-2.5 py-1 rounded-full bg-[#FFFFFF] hover:bg-[#EFF8E7] text-[#111111] hover:text-[#16A34A] border border-[#E8E4D9] hover:border-[#16A34A] text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E8E4D9] flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message to your specialist..."
            className="flex-1 py-2.5 px-4 rounded-full bg-[#FFFFFF] text-xs font-medium text-[#111111] placeholder:text-[#6B7280] border border-[#E8E4D9] focus:outline-none focus:border-[#16A34A] focus:bg-white transition-all"
          />

          <button
            type="button"
            disabled={!inputText.trim() || sending}
            onClick={() => handleSendMessage()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              inputText.trim() && !sending
                ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md shadow-[#16A34A]/30 active:scale-95'
                : 'bg-[#E8E4D9] text-[#9CA3AF] cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 ml-0.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
