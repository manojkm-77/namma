import { useMemo } from 'react';
import { useAppStore } from '../stores/app-store';
import { lightColors, darkColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, elevation } from '../theme/spacing';

export function useTheme() {
  const themeMode = useAppStore((s) => s.themeMode);
  const isDark = themeMode === 'dark';

  const theme = useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    borderRadius,
    elevation,
    isDark,
  }), [isDark]);

  return theme;
}
