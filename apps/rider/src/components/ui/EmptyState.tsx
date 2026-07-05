import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.huge,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
      }}>
        <Text style={{ fontSize: 36 }}>{icon}</Text>
      </View>
      <Text style={{
        color: colors.onSurface,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: spacing.sm,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      {description && (
        <Text style={{
          color: colors.onSurfaceVariant,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 22,
        }}>
          {description}
        </Text>
      )}
    </View>
  );
}
