import React from 'react';

interface AdminPreloaderProps {
  message?: string;
}

/**
 * Branded animated preloader displayed while initializing authentication
 * and restoring active administrator sessions.
 */
export const AdminPreloader: React.FC<AdminPreloaderProps> = ({
  message = 'Initializing Admin Portal...',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7FCF8] via-white to-[#ECFDF3] px-6 select-none"
      role="status"
      aria-live="polite"
      aria-label="Loading Quick Appointments Admin Panel"
    >
      {/* Subtle decorative mint wave footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden opacity-80">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M0,120 C320,210 620,40 980,130 C1200,185 1350,140 1440,95 L1440,220 L0,220 Z"
            fill="#DCFCE7"
            fillOpacity="0.65"
          />
          <path
            d="M0,165 C420,90 840,220 1440,125 L1440,220 L0,220 Z"
            fill="#BBF7D0"
            fillOpacity="0.55"
          />
        </svg>
      </div>

      {/* Central animated brand card */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer pulse halo */}
          <span className="animate-qa-pulse-ring absolute h-28 w-28 rounded-3xl border-2 border-[#22C55E]/40 bg-[#DCFCE7]/40" />
          {/* Rotating emerald orbit border */}
          <span
            className="absolute h-24 w-24 animate-spin rounded-full border-[3px] border-[#DCFCE7] border-t-[#16A34A] border-r-[#22C55E]"
            style={{ animationDuration: '1.15s' }}
          />
          {/* Logo container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-[0_12px_32px_rgba(22,163,74,0.16)] ring-1 ring-[#DCFCE7]">
            <img
              src="/logo.png"
              alt="Quick Appointments"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Brand wordmark */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
            Quick <span className="text-[#16A34A]">Appointments</span>
          </h1>
          <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7]/80 px-3 py-0.5 text-xs font-semibold text-[#15803D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Admin Panel
          </div>
        </div>

        {/* Smooth green progress indicator */}
        <div className="mt-6 w-56 overflow-hidden rounded-full bg-[#DCFCE7] p-0.5 shadow-inner">
          <div className="animate-qa-shimmer h-1.5 w-24 rounded-full bg-gradient-to-r from-[#22C55E] via-[#16A34A] to-[#15803D]" />
        </div>

        <p className="mt-3 text-xs font-medium tracking-wide text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
};

