import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
}

// 1. Beauty & Salon / Skin Care: Smiling face with sparkles
export const IconBeautyFace: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9 10.5h.01M15 10.5h.01" strokeWidth="2.4" />
    <path d="M8.8 14.5c.8 1.4 2 2.2 3.2 2.2s2.4-.8 3.2-2.2" />
    <path d="M19.5 4.5l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" fill={color} stroke="none" />
    <path d="M4.5 7.5l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z" fill={color} stroke="none" />
  </svg>
);

// 2. Hair Care: Scissors
export const IconScissors: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

// 3. Home Cleaning: House with sparkles
export const IconHomeCleaning: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20v-9.5z" />
    <path d="M19 4l.6 1.2 1.2.6-1.2.6-.6 1.2-.6-1.2-1.2-.6 1.2-.6z" fill={color} stroke="none" />
    <path d="M10 13l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill={color} stroke="none" />
  </svg>
);

// 4. Home Repair: Crossed wrenches
export const IconHomeRepair: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    <path d="M5 19l4-4" />
  </svg>
);

// 5. Wellness & Spa: Lotus flower
export const IconWellnessLotus: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4c-1.5 3-3 6.5-3 9.5 0 2.2 1.3 4 3 4s3-1.8 3-4c0-3-1.5-6.5-3-9.5z" />
    <path d="M9 13.5C7.2 11 5 9.5 3.5 11c-1.5 1.5-.5 4.5 1.5 6 1.8 1.4 4 1.5 5 1.2" />
    <path d="M15 13.5c1.8-2.5 4-4 5.5-2.5 1.5 1.5.5 4.5-1.5 6-1.8 1.4-4 1.5-5 1.2" />
    <path d="M7 19.5c2.5.5 7.5.5 10 0" />
  </svg>
);

// 6. Appliance Repair: Washing machine
export const IconWashingMachine: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <circle cx="12" cy="13" r="4.2" />
    <path d="M12 11.5c-1 0-1.8.8-1.8 1.8" />
    <circle cx="8" cy="6.5" r=".7" fill={color} />
    <circle cx="11" cy="6.5" r=".7" fill={color} />
  </svg>
);

// 7. Plumbing: Water tap dripping
export const IconPlumbingTap: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 10h10a4 4 0 0 1 4 4v2h-4v-2a1 1 0 0 0-1-1H3v-3z" />
    <path d="M7 6v4" />
    <path d="M5 6h4" />
    <path d="M15 19c0 1.1-.9 2-2 2s-2-.9-2-2c0-1.2 2-3 2-3s2 1.8 2 3z" fill={color} />
  </svg>
);

// 8. AC Repair & Service: Split AC unit with airflow breeze
export const IconAirConditioner: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="6" width="18" height="8" rx="2" />
    <line x1="7" y1="10" x2="17" y2="10" />
    <path d="M7 17c.5 1 1.5 2 2.5 2" />
    <path d="M11 17c.5 1 1.5 2 2.5 2" />
    <path d="M15 17c.5 1 1.5 2 2.5 2" />
  </svg>
);

// 9. Car Care: Front view of vehicle with sparkle
export const IconCarCare: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z" />
    <circle cx="7.5" cy="13.5" r="1" fill={color} />
    <circle cx="16.5" cy="13.5" r="1" fill={color} />
    <path d="M19.5 4l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill={color} stroke="none" />
  </svg>
);

// 10. Pet Care: Paw print
export const IconPetPaw: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 11.5c-2.5 0-4.5 1.8-4.5 4 0 1.8 1.8 3.5 4.5 3.5s4.5-1.7 4.5-3.5c0-2.2-2-4-4.5-4z" />
    <circle cx="7" cy="8.5" r="1.8" />
    <circle cx="10.5" cy="6" r="1.8" />
    <circle cx="14.5" cy="6" r="1.8" />
    <circle cx="18" cy="8.5" r="1.8" />
  </svg>
);

// 11. IT & Electronics: Laptop
export const IconLaptop: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="5" width="16" height="11" rx="1.5" />
    <path d="M2 19h20v.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 19.5V19z" />
  </svg>
);

// 12. More Services: 4 Rounded squares (2x2 grid)
export const IconMoreGrid: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="6" height="6" rx="2" />
    <rect x="14" y="4" width="6" height="6" rx="2" />
    <rect x="4" y="14" width="6" height="6" rx="2" />
    <rect x="14" y="14" width="6" height="6" rx="2" />
  </svg>
);

// 13. Makeup: Brushes in holder
export const IconMakeupBrushes: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8 3c0 2 1.5 3 1.5 4.5V13H6.5V7.5C6.5 6 8 5 8 3z" />
    <path d="M12 2c0 2 1.5 3 1.5 4.5V13h-3V6.5C10.5 5 12 4 12 2z" />
    <path d="M16 4c0 2 1.5 3 1.5 4V13h-3V8c0-1.5 1.5-2.5 1.5-4z" />
    <path d="M6 13h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7z" />
  </svg>
);

// 14. Nail Care: Nail polish bottle
export const IconNailPolish: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="10" y="3" width="4" height="6" rx="1" />
    <path d="M7 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
    <path d="M9 14h6" />
  </svg>
);

// 15. Eye Care: Eye with eyelashes
export const IconEyeCare: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 13c3.5-5.5 14.5-5.5 18 0" />
    <circle cx="12" cy="13.5" r="2.8" />
    <line x1="5.5" y1="9" x2="4.5" y2="7.5" />
    <line x1="9" y1="7.8" x2="8.5" y2="6" />
    <line x1="12" y1="7.2" x2="12" y2="5.5" />
    <line x1="15" y1="7.8" x2="15.5" y2="6" />
    <line x1="18.5" y1="9" x2="19.5" y2="7.5" />
  </svg>
);

// 16. Facial & Spa: Face with headband
export const IconFacialSpa: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4a7.5 7.5 0 0 1 7.5 7.5v1.2a7.5 7.5 0 0 1-15 0v-1.2A7.5 7.5 0 0 1 12 4z" />
    <path d="M4.5 10c2-2 13-2 15 0" />
    <circle cx="9.5" cy="13.5" r=".8" fill={color} />
    <circle cx="14.5" cy="13.5" r=".8" fill={color} />
    <path d="M10 16c1 .8 3 .8 4 0" />
    <circle cx="5.5" cy="7.5" r="1.5" />
  </svg>
);

// 17. Men's Grooming: Bearded man face
export const IconMensGrooming: React.FC<IconProps> = ({ className = 'w-6 h-6', size = 24, color = '#16A34A' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7 6c0-2.5 2.2-3.5 5-3.5s5 1 5 3.5" />
    <circle cx="9.5" cy="10" r=".8" fill={color} />
    <circle cx="14.5" cy="10" r=".8" fill={color} />
    <path d="M6 10c0 3 1.5 5 2.5 6.5 1 1.5 2.2 2.5 3.5 2.5s2.5-1 3.5-2.5C16.5 15 18 13 18 10v-1H6v1z" />
    <path d="M9 13.5c1.5 1 4.5 1 6 0" />
  </svg>
);
