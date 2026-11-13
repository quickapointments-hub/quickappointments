import React from 'react';

export const LeavesDecoration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`pointer-events-none select-none absolute bottom-0 left-0 right-0 h-44 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 375 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
        preserveAspectRatio="none"
      >
        {/* Soft undulating cream-green hills */}
        <path
          d="M0 160V120C80 90 140 145 230 115C300 90 340 70 375 75V160H0Z"
          fill="#EEF7E3"
          fillOpacity="0.75"
        />
        <path
          d="M0 160V135C90 115 170 145 260 125C320 110 355 95 375 100V160H0Z"
          fill="#E2F1D1"
          fillOpacity="0.6"
        />

        {/* Stem */}
        <path
          d="M370 155C350 145 330 135 320 115C315 105 310 90 312 75"
          stroke="#7CB342"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Lower Leaf */}
        <path
          d="M320 115C305 118 285 118 280 110C282 100 295 95 312 102C317 106 320 112 320 115Z"
          fill="#8BC34A"
          fillOpacity="0.85"
        />
        <path
          d="M320 115C305 112 288 108 280 110"
          stroke="#689F38"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Upper Leaf */}
        <path
          d="M312 75C308 55 315 40 325 35C332 45 330 60 318 73C315 75 313 75 312 75Z"
          fill="#7CB342"
          fillOpacity="0.9"
        />
        <path
          d="M312 75C317 62 322 48 325 35"
          stroke="#558B2F"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Side Bud Leaf */}
        <path
          d="M338 128C350 120 360 122 368 118C366 128 355 133 342 131C339 130 338 129 338 128Z"
          fill="#9CCC65"
          fillOpacity="0.85"
        />
      </svg>
    </div>
  );
};

