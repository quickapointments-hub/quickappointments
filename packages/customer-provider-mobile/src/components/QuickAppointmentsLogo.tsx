import React from 'react';

interface QuickAppointmentsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuickAppointmentsLogo: React.FC<QuickAppointmentsLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 38 : 30;
  const titleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const subSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[10px]' : 'text-[9px]';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Official Vector Calendar Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Calendar Base / Drop Perspective */}
        <path d="M6 14L10 34H36L32 14H6Z" fill="#1E293B" />
        {/* White Front Page */}
        <rect
          x="8"
          y="10"
          width="26"
          height="22"
          rx="3"
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth="2.5"
        />
        {/* Dark Top Header Bar */}
        <path
          d="M8 13C8 11.3431 9.34315 10 11 10H31C32.6569 10 34 11.3431 34 13V15H8V13Z"
          fill="#1E293B"
        />
        {/* Spiral Binder Rings */}
        <circle cx="14" cy="9" r="1.8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="21" cy="9" r="1.8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
        <circle cx="28" cy="9" r="1.8" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
        {/* Calendar Grid Checkboxes / Green Slots */}
        <rect x="12" y="18" width="3.5" height="3.5" rx="0.8" fill="#16A34A" />
        <rect x="18.5" y="18" width="3.5" height="3.5" rx="0.8" fill="#16A34A" />
        <rect x="25" y="18" width="3.5" height="3.5" rx="0.8" fill="#16A34A" />
        <rect x="12" y="24" width="3.5" height="3.5" rx="0.8" fill="#16A34A" />
        <rect x="18.5" y="24" width="3.5" height="3.5" rx="0.8" fill="#16A34A" />
        <rect x="25" y="24" width="3.5" height="3.5" rx="0.8" fill="#CBD5E1" />
      </svg>

      {/* Typography: QUICK - APPOINTMENTS - */}
      <div className="flex flex-col">
        <span className={`font-black tracking-tight text-[#111111] leading-none ${titleSize}`}>
          QUICK
        </span>
        <span
          className={`font-bold tracking-widest text-[#16A34A] leading-none mt-0.5 ${subSize}`}
        >
          - APPOINTMENTS -
        </span>
      </div>
    </div>
  );
};
