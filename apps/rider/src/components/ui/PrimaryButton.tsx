import { useCallback } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: string;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'primary', icon, style }: PrimaryButtonProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  const bgColor = useCallback(() => {
    if (disabled) return colors.skeleton;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surfaceVariant;
      case 'danger': return colors.error;
      case 'outline': return 'transparent';
      default: return colors.primary;
    }
  }, [disabled, variant, colors]);

  const txtColor = useCallback(() => {
    if (disabled) return colors.onSurfaceVariant;
    switch (variant) {
      case 'primary': return colors.onPrimary;
      case 'secondary': return colors.onSurface;
      case 'danger': return colors.onError;
      case 'outline': return colors.primary;
      default: return colors.onPrimary;
    }
  }, [disabled, variant, colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: bgColor(),
        height: 52,
        borderRadius: br.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: variant === 'outline' ? colors.primary : 'transparent',
        paddingHorizontal: spacing.xl,
        opacity: disabled ? 0.6 : 1,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor()} size="small" />
      ) : (
        <>
          {icon && <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{icon}</Text>}
          <Text style={{
            color: txtColor(),
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: 0.3,
          }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
