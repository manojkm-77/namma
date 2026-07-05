import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './spacing';

export const designTokens = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  elevation,
} as const;

export type DesignTokens = typeof designTokens;

export const getThemeTokens = (isDark: boolean) => ({
  colors: isDark ? darkColors : lightColors,
  typography,
  spacing,
  borderRadius,
  elevation,
});
