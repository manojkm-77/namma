import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{
        color: colors.onSurfaceVariant,
        fontSize: 14,
        fontWeight: '600',
        marginTop: spacing.lg,
        letterSpacing: 0.3,
      }}>
        {message}
      </Text>
    </View>
  );
}
