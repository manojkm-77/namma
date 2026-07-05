import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { RideHistoryItem } from '../../types';

interface RideCardProps {
  ride: RideHistoryItem;
  onPress?: (ride: RideHistoryItem) => void;
  onRepeat?: (ride: RideHistoryItem) => void;
  onRate?: (ride: RideHistoryItem) => void;
}

export function RideCard({ ride, onPress, onRepeat, onRate }: RideCardProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  const statusColorMap: Record<string, string> = {
    completed: colors.success,
    cancelled: colors.error,
    requested: colors.warning,
    accepted: colors.primary,
    arrived: colors.primaryLight,
    picked_up: '#8B5CF6',
  };

  const statusBgMap: Record<string, string> = {
    completed: '#ECFDF5',
    cancelled: '#FEF2F2',
    requested: '#FFFBEB',
    accepted: '#FEF3C7',
    arrived: '#FEF3C7',
    picked_up: '#F5F3FF',
  };

  const formattedDate = new Date(ride.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      onPress={() => onPress?.(ride)}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.surface,
        borderRadius: br.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceVariant,
        paddingBottom: spacing.md,
      }}>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '600' }}>
          {formattedDate}
        </Text>
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>
          ₹{ride.fareAmount.toFixed(0)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ marginTop: 4, marginRight: spacing.md, alignItems: 'center' }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />
          <View style={{ width: 2, height: 20, backgroundColor: colors.outline, marginVertical: 2 }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: '600', marginBottom: 4 }} numberOfLines={1}>
            {ride.pickupAddress}
          </Text>
          <Text style={{ color: colors.onSurface, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
            {ride.dropAddress}
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceVariant,
      }}>
        <View style={{
          backgroundColor: statusBgMap[ride.status] || colors.surfaceVariant,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: br.sm,
        }}>
          <Text style={{
            color: statusColorMap[ride.status] || colors.onSurfaceVariant,
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
          }}>
            {ride.status}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {onRepeat && (
            <TouchableOpacity
              onPress={() => onRepeat(ride)}
              style={{
                backgroundColor: colors.surfaceVariant,
                paddingHorizontal: spacing.md,
                paddingVertical: 6,
                borderRadius: br.sm,
              }}
            >
              <Text style={{ color: colors.onSurface, fontSize: 11, fontWeight: '700' }}>↻ Repeat</Text>
            </TouchableOpacity>
          )}
          {onRate && ride.status === 'completed' && (
            <TouchableOpacity
              onPress={() => onRate(ride)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.md,
                paddingVertical: 6,
                borderRadius: br.sm,
              }}
            >
              <Text style={{ color: colors.onPrimary, fontSize: 11, fontWeight: '700' }}>★ Rate</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {ride.driverName && (
        <View style={{
          marginTop: spacing.sm,
          backgroundColor: colors.surfaceVariant,
          borderRadius: br.sm,
          padding: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, marginRight: spacing.sm }}>
            Driver:
          </Text>
          <Text style={{ color: colors.onSurface, fontSize: 12, fontWeight: '600' }}>
            {ride.driverName}
          </Text>
          {ride.licensePlate && (
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 10, marginLeft: spacing.sm }}>
              · {ride.licensePlate}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
