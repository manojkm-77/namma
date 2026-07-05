import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { VEHICLE_OPTIONS } from '../../services/ride-service';
import type { VehicleOption, FareEstimate } from '../../types';

interface VehicleSelectorProps {
  selectedType?: string;
  fareEstimates: FareEstimate[];
  onSelect: (vehicle: VehicleOption) => void;
  language?: 'en' | 'kn';
}

export function VehicleSelector({ selectedType, fareEstimates, onSelect, language = 'en' }: VehicleSelectorProps) {
  const { colors, borderRadius: br, spacing } = useTheme();

  return (
    <View>
      <Text style={{
        color: colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.md,
      }}>
        {language === 'kn' ? 'ವಾಹನ ಆಯ್ಕೆಮಾಡಿ' : 'Select Vehicle'}
      </Text>
      <FlatList
        data={VEHICLE_OPTIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm }}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => {
          const fare = fareEstimates.find((f) => f.vehicleType === item.type);
          const isSelected = selectedType === item.type;
          const isSurge = item.surgeMultiplier > 1;

          return (
            <TouchableOpacity
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
              style={{
                backgroundColor: isSelected ? colors.primary + '15' : colors.surface,
                borderRadius: br.lg,
                padding: spacing.lg,
                minWidth: 130,
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : colors.outline,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: isSelected ? 3 : 0,
              }}
            >
              <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: spacing.sm }}>
                {item.image}
              </Text>
              <Text style={{
                color: colors.onSurface,
                fontSize: 15,
                fontWeight: '700',
                textAlign: 'center',
              }}>
                {language === 'kn' ? item.nameKn : item.name}
              </Text>

              {fare && (
                <Text style={{
                  color: colors.primary,
                  fontSize: 20,
                  fontWeight: '900',
                  textAlign: 'center',
                  marginTop: 4,
                }}>
                  ₹{fare.finalFare.toFixed(0)}
                </Text>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
                  🕐 {item.eta}min
                </Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 11 }}>
                  👥 {item.capacity}
                </Text>
              </View>

              {isSurge && (
                <View style={{
                  backgroundColor: colors.error + '15',
                  borderRadius: br.xs,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  marginTop: spacing.sm,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: colors.error, fontSize: 10, fontWeight: '700' }}>
                    ⚡ {item.surgeMultiplier}x
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
