import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';
import { useAuth } from '../../src/lib/auth-context';

type VehicleType = 'auto' | 'mini' | 'sedan' | 'suv';

interface VehicleInfo {
  vehicleType: VehicleType;
  licensePlate: string;
  modelName: string;
  insuranceExpiry: string;
  isRegistered: boolean;
}

const VEHICLE_TYPES: { key: VehicleType; label: string; icon: string; description: string }[] = [
  { key: 'auto', label: 'Auto Rickshaw', icon: '🛺', description: '3-seater, best for city' },
  { key: 'mini', label: 'Mini Cab', icon: '🚗', description: '4-seater, compact hatchback' },
  { key: 'sedan', label: 'Sedan', icon: '🚙', description: '4-seater, premium comfort' },
  { key: 'suv', label: 'SUV', icon: '🚐', description: '6-seater, family & group' }
];

function VehicleTypeSelector({
  selected,
  onSelect,
  disabled
}: {
  selected: VehicleType | null;
  onSelect: (t: VehicleType) => void;
  disabled: boolean;
}) {
  return (
    <View className="flex-row flex-wrap justify-between mb-4">
      {VEHICLE_TYPES.map((vt) => {
        const isActive = selected === vt.key;
        return (
          <TouchableOpacity
            key={vt.key}
            onPress={() => onSelect(vt.key)}
            disabled={disabled}
            className={`w-[48%] rounded-2xl p-4 mb-3 border ${
              isActive
                ? 'bg-amber-900/20 border-amber-500'
                : 'bg-[#1e1e1e] border-[#2a2a2a]'
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-2xl mb-2">{vt.icon}</Text>
            <Text
              className={`text-sm font-bold ${
                isActive ? 'text-amber-300' : 'text-white'
              }`}
            >
              {vt.label}
            </Text>
            <Text className="text-gray-500 text-[10px] mt-1 font-medium">
              {vt.description}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function VehicleScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<VehicleInfo>({
    vehicleType: 'auto',
    licensePlate: '',
    modelName: '',
    insuranceExpiry: '',
    isRegistered: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicle = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('vehicle_type, license_plate, model_name, insurance_expiry')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Vehicle Fetch Error]:', error.message);
      }

      if (data && data.license_plate && !data.license_plate.startsWith('TEMP-')) {
        setVehicle({
          vehicleType: (data.vehicle_type as VehicleType) ?? 'auto',
          licensePlate: data.license_plate ?? '',
          modelName: data.model_name ?? '',
          insuranceExpiry: data.insurance_expiry ?? '',
          isRegistered: true
        });
      }
    } catch (err) {
      console.error('[Vehicle Exception]:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchVehicle().finally(() => setIsLoading(false));
  }, [fetchVehicle]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchVehicle();
    setIsRefreshing(false);
  }, [fetchVehicle]);

  const validateForm = useCallback((): string | null => {
    const plate = vehicle.licensePlate.toUpperCase().replace(/\s/g, '');
    const plateRegex = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/;
    if (!plateRegex.test(plate)) {
      return 'License plate must match format like KA12AB1234.';
    }
    if (vehicle.modelName.trim().length < 2) {
      return 'Please enter the vehicle model name.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vehicle.insuranceExpiry)) {
      return 'Insurance expiry must be in YYYY-MM-DD format.';
    }
    const expiryDate = new Date(vehicle.insuranceExpiry);
    if (expiryDate <= new Date()) {
      return 'Insurance policy must not be expired.';
    }
    return null;
  }, [vehicle]);

  const handleRegister = useCallback(async () => {
    const err = validateForm();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          vehicle_type: vehicle.vehicleType,
          license_plate: vehicle.licensePlate.toUpperCase().replace(/\s/g, ''),
          model_name: vehicle.modelName.trim(),
          insurance_expiry: vehicle.insuranceExpiry,
          is_active: false,
          duty_status: 'offline',
          last_ping_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) {
        Alert.alert('Registration Failed', updateError.message);
        setIsSubmitting(false);
        return;
      }

      setVehicle((prev) => ({ ...prev, isRegistered: true }));

      Alert.alert(
        'Vehicle Registered',
        `Your ${VEHICLE_TYPES.find((t) => t.key === vehicle.vehicleType)?.label} (${vehicle.licensePlate.toUpperCase()}) has been registered successfully. You can now go online from the dashboard.`,
        [{ text: 'Go to Dashboard', onPress: () => router.push('/(tabs)') }]
      );
    } catch (err) {
      console.error('[Vehicle Register Exception]:', err);
      Alert.alert('Error', 'Could not register vehicle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [vehicle, validateForm, user?.id, router]);

  const handleUpdatePlate = useCallback((text: string) => {
    setVehicle((prev) => ({ ...prev, licensePlate: text.toUpperCase() }));
  }, []);

  return (
    <View className="flex-1 bg-[#111111]">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-black tracking-tight">
          Vehicle Registration
        </Text>
        <Text className="text-gray-500 text-xs font-semibold mt-1 tracking-wide">
          {vehicle.isRegistered ? 'Update your vehicle details' : 'Register your vehicle to start earning'}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3"
            >
              <View className="h-4 w-28 bg-[#2a2a2a] rounded-full mb-3" />
              <View className="h-10 w-full bg-[#2a2a2a] rounded-xl" />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#fbbf24"
              colors={['#fbbf24']}
            />
          }
        >
          {vehicle.isRegistered && (
            <View className="bg-emerald-900/10 border border-emerald-800 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center mb-2">
                <Text className="text-emerald-400 text-lg mr-2">✓</Text>
                <Text className="text-white text-base font-bold">
                  Vehicle Registered
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-400 text-xs font-medium">
                  {VEHICLE_TYPES.find((t) => t.key === vehicle.vehicleType)?.label}
                </Text>
                <Text className="text-amber-400 text-sm font-black tracking-wider font-mono">
                  {vehicle.licensePlate}
                </Text>
              </View>
              {vehicle.modelName && (
                <Text className="text-gray-500 text-[11px] mt-1 font-medium">
                  {vehicle.modelName}
                </Text>
              )}
            </View>
          )}

          {/* ── Vehicle Type ── */}
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">
            Vehicle Type
          </Text>
          <VehicleTypeSelector
            selected={vehicle.vehicleType}
            onSelect={(t) => setVehicle((prev) => ({ ...prev, vehicleType: t }))}
            disabled={false}
          />

          {/* ── License Plate ── */}
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">
              License Plate Number
            </Text>
            <Text className="text-gray-500 text-[11px] mb-3 font-medium">
              Enter your vehicle registration number as shown on the RC card.
            </Text>
            <TextInput
              className="h-12 border border-[#333] rounded-xl px-4 text-sm font-mono font-bold text-white bg-[#161616] tracking-widest"
              placeholder="KA12AB1234"
              placeholderTextColor="#555"
              value={vehicle.licensePlate}
              onChangeText={handleUpdatePlate}
              autoCapitalize="characters"
              maxLength={12}
            />
          </View>

          {/* ── Model Name ── */}
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">
              Vehicle Model
            </Text>
            <Text className="text-gray-500 text-[11px] mb-3 font-medium">
              Make and model of your vehicle (e.g. Maruti Suzuki Alto, Bajaj RE)
            </Text>
            <TextInput
              className="h-12 border border-[#333] rounded-xl px-4 text-sm text-white bg-[#161616]"
              placeholder="e.g. Bajaj RE Compact"
              placeholderTextColor="#555"
              value={vehicle.modelName}
              onChangeText={(text) =>
                setVehicle((prev) => ({ ...prev, modelName: text }))
              }
            />
          </View>

          {/* ── Insurance Expiry ── */}
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-5">
            <Text className="text-white text-sm font-bold mb-2">
              Insurance Expiry Date
            </Text>
            <Text className="text-gray-500 text-[11px] mb-3 font-medium">
              Valid insurance is mandatory. Enter date in YYYY-MM-DD format.
            </Text>
            <TextInput
              className="h-12 border border-[#333] rounded-xl px-4 text-sm text-white bg-[#161616] font-mono"
              placeholder="2026-12-31"
              placeholderTextColor="#555"
              value={vehicle.insuranceExpiry}
              onChangeText={(text) =>
                setVehicle((prev) => ({ ...prev, insuranceExpiry: text }))
              }
              maxLength={10}
            />
          </View>

          {/* ── Submit / Update Button ── */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSubmitting}
            className={`py-4 rounded-xl items-center mb-8 ${
              isSubmitting ? 'bg-gray-800' : 'bg-amber-400 active:opacity-80'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text
                className={`text-sm font-extrabold tracking-wide ${
                  isSubmitting ? 'text-gray-600' : 'text-[#111111]'
                }`}
              >
                {vehicle.isRegistered ? 'Update Vehicle Details' : 'Register Vehicle'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
