import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorScreen({ message, onRetry, retryLabel = 'Retry' }: ErrorScreenProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    }}>
      <View style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
      }}>
        <Text style={{ fontSize: 28 }}>⚠️</Text>
      </View>
      <Text style={{
        color: colors.onSurface,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: spacing.sm,
      }}>
        Something went wrong
      </Text>
      <Text style={{
        color: colors.onSurfaceVariant,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
      }}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.md,
            borderRadius: br.md,
          }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
