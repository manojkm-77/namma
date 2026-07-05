import { View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBlock({ width = '100%', height = 12, borderRadius: br, style }: SkeletonBlockProps) {
  const { colors, borderRadius: themeBr } = useTheme();

  return (
    <View style={[{
      width: width as any,
      height,
      backgroundColor: colors.skeleton,
      borderRadius: br ?? themeBr.sm,
      overflow: 'hidden',
    }, style]} />
  );
}

export function SkeletonCard() {
  const { spacing, borderRadius: br, colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: br.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.outline,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <SkeletonBlock width={120} height={12} />
        <SkeletonBlock width={60} height={20} borderRadius={8} />
      </View>
      <SkeletonBlock width="80%" height={14} style={{ marginBottom: spacing.sm }} />
      <SkeletonBlock width="60%" height={14} style={{ marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonBlock width={80} height={20} borderRadius={8} />
        <SkeletonBlock width={50} height={12} />
      </View>
    </View>
  );
}
