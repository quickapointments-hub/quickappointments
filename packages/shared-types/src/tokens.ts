/**
 * Quick Appointments Design System Tokens
 * Directly derived from official Quick Appointments Logo
 */

export const BRAND_COLORS = {
  // Primary Lime/Apple Green extracted from the logo calendar highlights and Q-tail
  primary: {
    50: '#F1F9EC',
    100: '#DEF1D4',
    200: '#BEE4A9',
    300: '#9DD47B',
    400: '#80C551',
    500: '#65B32E', // Brand Core Green
    600: '#529624', // Interactive Hover / Focus
    700: '#417A1C',
    800: '#305C14',
    900: '#21400D',
    950: '#102106',
  },
  // Charcoal Obsidian extracted from the "QUICK" lettering & calendar body
  charcoal: {
    50: '#F8F9FA',
    100: '#F1F2F4',
    200: '#E2E4E8',
    300: '#C7CAD1',
    400: '#8E93A0',
    500: '#5F6473',
    600: '#3E424F',
    700: '#282B33',
    800: '#1A1C22',
    900: '#111114', // Brand Jet Black
    950: '#0B0C0E',
  },
  // Functional Status
  status: {
    success: '#16A34A',
    successBg: '#ECFDF5',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    error: '#DC2626',
    errorBg: '#FEF2F2',
    info: '#0284C7',
    infoBg: '#F0F9FF',
  },
  // Surfaces & Backgrounds
  surface: {
    canvas: '#F8FAFC',
    card: '#FFFFFF',
    cardSecondary: '#F8FAFC',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    overlay: 'rgba(17, 17, 20, 0.65)',
  },
  // Dark mode surfaces
  darkSurface: {
    canvas: '#0E1013',
    card: '#16181D',
    cardSecondary: '#1E2128',
    border: '#282B35',
    borderSubtle: '#1F222A',
  }
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Plus Jakarta Sans", Inter, sans-serif',
    mono: '"JetBrains Mono", Menlo, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  }
} as const;

export const RADII = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.25rem',// 20px
  full: '9999px',
} as const;

export const SHADOWS = {
  subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  card: '0 4px 6px -1px rgba(17, 17, 20, 0.05), 0 2px 4px -1px rgba(17, 17, 20, 0.03)',
  cardHover: '0 10px 15px -3px rgba(17, 17, 20, 0.08), 0 4px 6px -2px rgba(17, 17, 20, 0.04)',
  elevated: '0 20px 25px -5px rgba(17, 17, 20, 0.1), 0 10px 10px -5px rgba(17, 17, 20, 0.04)',
  brandGlow: '0 0 16px 0 rgba(101, 179, 46, 0.25)',
} as const;

