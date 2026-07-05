export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray950: '#030712',

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald500: '#10B981',
  emerald600: '#059669',

  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',

  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  blue600: '#2563EB',

  violet50: '#F5F3FF',
  violet500: '#8B5CF6',

  orange500: '#F97316',
} as const;

export const lightColors = {
  primary: '#863D3C',
  primaryLight: '#A05C5B',
  primaryDark: '#6B2E2D',
  onPrimary: '#FFFFFF',

  secondary: '#1C1C1E',
  secondaryLight: '#3A3A3C',

  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceVariant: '#F2F2F7',
  onSurface: '#1C1C1E',
  onSurfaceVariant: '#6B7280',

  accent: '#F59E0B',
  accentLight: '#FDE68A',

  error: '#DC2626',
  onError: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',

  outline: '#E5E7EB',
  outlineVariant: '#D1D5DB',

  shadow: 'rgba(0, 0, 0, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.4)',

  mapDark: '#E8E8E8',
  mapLight: '#F5F5F5',

  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
} as const;

export const darkColors = {
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  primaryDark: '#D97706',
  onPrimary: '#1C1C1E',

  secondary: '#F5F5F7',
  secondaryLight: '#D1D5DB',

  background: '#0E0E10',
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  onSurface: '#F5F5F7',
  onSurfaceVariant: '#9CA3AF',

  accent: '#F59E0B',
  accentLight: '#92400E',

  error: '#EF4444',
  onError: '#FFFFFF',

  success: '#10B981',
  warning: '#F59E0B',

  outline: '#2C2C2E',
  outlineVariant: '#3A3A3C',

  shadow: 'rgba(0, 0, 0, 0.3)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  mapDark: '#1A1A1E',
  mapLight: '#2C2C2E',

  skeleton: '#2C2C2E',
  skeletonHighlight: '#3A3A3C',
} as const;

export type ColorScheme = typeof lightColors;
