/**
 * QUICK APPOINTMENTS – OFFICIAL BRAND THEME SYSTEM
 * 
 * Derived directly from the official Quick Appointments logo:
 * - Dominant Primary Background: Warm Cream (#FDFCF4)
 * - Secondary Background: Soft Light Cream (#F5F2E6)
 * - Surfaces / Cards: Clean Elevated White (#FFFFFF) with Cream Borders (#E8E4D9)
 * - Primary Typography: Jet Black (#111111)
 * - Secondary Typography: Professional Dark Grey (#4B5563)
 * - Primary Action Buttons: Logo Vibrant Green (#65B32E) with White Text (#FFFFFF)
 * - Accent / Selected States: Green (#65B32E) & Soft Cream-Green Tint (#EFF8E7)
 * - Strict Rule: Zero unbranded blue, purple, or dark background intrusions.
 */

export const THEME_COLORS = {
  // Application Backgrounds
  primaryBg: '#FDFCF4',       // Cream dominant background
  secondaryBg: '#F5F2E6',     // Light cream secondary sections
  surface: '#FFFFFF',         // Cards and interactive surfaces
  surfaceSubtle: '#FAF8F0',   // Subtle card highlight
  
  // Typography
  textPrimary: '#111111',     // Black headings and primary body text
  textSecondary: '#4B5563',   // Dark grey readable secondary text
  textMuted: '#6B7280',       // Muted neutral grey captions
  textInverse: '#FFFFFF',     // White text on primary buttons
  
  // Brand Actions & Accents
  primary: '#65B32E',         // Official Brand Logo Green
  primaryDark: '#529624',     // Pressed / Hover Green
  primaryLight: '#80C551',    // Secondary green highlights
  primaryDim: '#EFF8E7',      // Soft cream-green pill / selected badge
  
  // Borders & Dividers
  border: '#E8E4D9',          // Soft cream / light grey border
  borderLight: '#F2EFE8',     // Hairline separator
  borderDark: '#D5CFBE',      // Defined contour border
  
  // Form Controls & Inputs
  inputBg: '#FFFFFF',         // Crisp white input
  inputBgCream: '#FAF8F0',    // Secondary input surface
  inputBorder: '#DCD8C8',     // Soft neutral input border
  inputFocusBorder: '#65B32E',// Brand green input focus border
  
  // Interactive & Selected States
  selectedBg: '#EFF8E7',      // Selected item background
  selectedBorder: '#65B32E',  // Selected item border
  selectedText: '#1B3808',    // Deep green readable text
  
  // Status & Feedback
  success: '#16A34A',         // Green success status
  successBg: '#F0FDF4',       // Green success notification banner
  successBorder: '#86EFAC',
  
  error: '#DC2626',           // Red error indicator
  errorBg: '#FEF2F2',         // Red error notification banner
  errorBorder: '#FCA5A5',
  
  warning: '#D97706',         // Warm amber warning
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(17, 17, 17, 0.05)',
  md: '0 4px 6px -1px rgba(17, 17, 17, 0.08), 0 2px 4px -2px rgba(17, 17, 17, 0.05)',
  lg: '0 10px 15px -3px rgba(17, 17, 17, 0.08), 0 4px 6px -4px rgba(17, 17, 17, 0.04)',
  xl: '0 20px 25px -5px rgba(17, 17, 17, 0.1), 0 8px 10px -6px rgba(17, 17, 17, 0.04)',
  greenGlow: '0 8px 20px -4px rgba(101, 179, 46, 0.35)',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// React Native Compatible Color Map
export const RN_COLORS = {
  bg: THEME_COLORS.primaryBg,
  bgSecondary: THEME_COLORS.secondaryBg,
  card: THEME_COLORS.surface,
  cardElevated: THEME_COLORS.surface,
  border: THEME_COLORS.border,
  borderDark: THEME_COLORS.borderDark,
  primary: THEME_COLORS.primary,
  primaryLight: THEME_COLORS.primaryLight,
  primaryDim: THEME_COLORS.primaryDim,
  text: THEME_COLORS.textPrimary,
  textSecondary: THEME_COLORS.textSecondary,
  textMuted: THEME_COLORS.textMuted,
  buttonText: THEME_COLORS.textInverse,
  inputBg: THEME_COLORS.inputBg,
  inputBorder: THEME_COLORS.inputBorder,
  danger: THEME_COLORS.error,
  dangerBg: THEME_COLORS.errorBg,
  warning: THEME_COLORS.warning,
  success: THEME_COLORS.success,
  successBg: THEME_COLORS.successBg,
};

