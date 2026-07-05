import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { DriverInfo } from '../../types';

interface DriverCardProps {
  driver: DriverInfo;
  otp: string;
  onCall?: () => void;
  onChat?: () => void;
  onTrack?: () => void;
  onSos?: () => void;
}

export function DriverCard({ driver, otp, onCall, onChat, onTrack, onSos }: DriverCardProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  const stars = Math.floor(driver.rating);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: br.lg,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceVariant,
        paddingBottom: spacing.md,
        marginBottom: spacing.md,
      }}>
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}>
          <Text style={{ fontSize: 28 }}>{driver.photo || '👤'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: '800' }}>
            {driver.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={{ color: colors.warning, fontSize: 14 }}>
              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginLeft: 4 }}>
              {driver.rating.toFixed(1)}
            </Text>
          </View>
        </View>
        <View style={{
          backgroundColor: colors.primary + '20',
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: br.sm,
        }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
            OTP: {otp}
          </Text>
        </View>
      </View>

      <View style={{
        backgroundColor: colors.surfaceVariant,
        borderRadius: br.sm,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Vehicle</Text>
          <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: '700' }}>
            {driver.vehicleColor} {driver.vehicleModel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>Number</Text>
          <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: '700', letterSpacing: 1 }}>
            {driver.vehicleNumber}
          </Text>
        </View>
      </View>

      {onCall && onTrack && (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={onCall}
            style={{
              flex: 1,
              backgroundColor: colors.success,
              height: 44,
              borderRadius: br.sm,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 4 }}>📞</Text>
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>Call</Text>
          </TouchableOpacity>
          {onChat && (
            <TouchableOpacity
              onPress={onChat}
              style={{
                flex: 1,
                backgroundColor: colors.surfaceVariant,
                height: 44,
                borderRadius: br.sm,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 4 }}>💬</Text>
              <Text style={{ color: colors.onSurface, fontWeight: '700', fontSize: 14 }}>Chat</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onTrack}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              height: 44,
              borderRadius: br.sm,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 4 }}>📍</Text>
            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 14 }}>Track</Text>
          </TouchableOpacity>
          {onSos && (
            <TouchableOpacity
              onPress={onSos}
              style={{
                width: 44,
                height: 44,
                borderRadius: br.sm,
                backgroundColor: colors.error,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>🆘</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
