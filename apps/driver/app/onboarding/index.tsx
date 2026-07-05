import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';
import { useAuth } from '../../src/lib/auth-context';

type OnboardingStep = 'welcome' | 'kyc' | 'vehicle' | 'complete';

interface DocumentFields {
  aadharNumber: string;
  aadharFrontUrl: string;
  aadharBackUrl: string;
  licenseNumber: string;
  licenseFrontUrl: string;
}

interface VehicleFields {
  vehicleType: 'auto' | 'mini' | 'sedan' | 'suv';
  licensePlate: string;
  modelName: string;
  insuranceExpiry: string;
}

const VEHICLE_OPTIONS: { key: VehicleFields['vehicleType']; label: string; icon: string }[] = [
  { key: 'auto', label: 'Auto', icon: '🛺' },
  { key: 'mini', label: 'Mini', icon: '🚗' },
  { key: 'sedan', label: 'Sedan', icon: '🚙' },
  { key: 'suv', label: 'SUV', icon: '🚐' }
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row items-center justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              i <= current ? 'bg-amber-400' : 'bg-[#2a2a2a]'
            }`}
          >
            <Text
              className={`text-xs font-black ${
                i <= current ? 'text-[#111111]' : 'text-gray-600'
              }`}
            >
              {i + 1}
            </Text>
          </View>
          {i < total - 1 && (
            <View
              className={`w-10 h-0.5 mx-1 ${
                i < current ? 'bg-amber-400' : 'bg-[#2a2a2a]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [docs, setDocs] = useState<DocumentFields>({
    aadharNumber: '',
    aadharFrontUrl: '',
    aadharBackUrl: '',
    licenseNumber: '',
    licenseFrontUrl: ''
  });

  const [vehicle, setVehicle] = useState<VehicleFields>({
    vehicleType: 'auto',
    licensePlate: '',
    modelName: '',
    insuranceExpiry: ''
  });

  const checkExisting = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('drivers')
        .select('is_kyc_verified, license_plate, vehicle_type')
        .eq('id', user.id)
        .single();

      if (data) {
        const hasKyc = data.is_kyc_verified === true;
        const hasVehicle =
          data.license_plate &&
          !data.license_plate.startsWith('TEMP-') &&
          data.vehicle_type;

        if (hasKyc && hasVehicle) {
          router.replace('/(tabs)');
          return;
        }
        if (hasKyc) setStep('vehicle');
        else setStep('kyc');
      }
    } catch {
      // Fresh user, start from welcome
    }
  }, [user?.id, router]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  const handleStart = () => setStep('kyc');

  const handleKycSubmit = async () => {
    const aadharClean = docs.aadharNumber.replace(/\s/g, '');
    if (!/^\d{12}$/.test(aadharClean)) {
      Alert.alert('Invalid', 'Aadhaar must be 12 digits.');
      return;
    }
    if (!docs.aadharFrontUrl.startsWith('http') || !docs.aadharBackUrl.startsWith('http')) {
      Alert.alert('Invalid', 'Please provide valid document image URLs.');
      return;
    }
    if (docs.licenseNumber.trim().length < 5) {
      Alert.alert('Invalid', 'Please enter a valid driving license number.');
      return;
    }
    if (!docs.licenseFrontUrl.startsWith('http')) {
      Alert.alert('Invalid', 'Please provide a valid license image URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user?.id,
        aadhar_number: `[Aadhaar Redacted - ${aadharClean.slice(-4)}]`,
        aadhar_front_url: docs.aadharFrontUrl,
        aadhar_back_url: docs.aadharBackUrl,
        license_number: `[License Redacted - ${docs.licenseNumber.slice(-4)}]`,
        license_front_url: docs.licenseFrontUrl,
        status: 'pending'
      });

      if (error) throw error;

      await supabase
        .from('drivers')
        .update({ kyc_submitted_at: new Date().toISOString() })
        .eq('id', user?.id);

      setStep('vehicle');
    } catch (err) {
      Alert.alert('Error', 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVehicleSubmit = async () => {
    const plate = vehicle.licensePlate.toUpperCase().replace(/\s/g, '');
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{4}$/.test(plate)) {
      Alert.alert('Invalid', 'License plate format must be like KA12AB1234.');
      return;
    }
    if (vehicle.modelName.trim().length < 2) {
      Alert.alert('Invalid', 'Please enter the vehicle model name.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vehicle.insuranceExpiry)) {
      Alert.alert('Invalid', 'Insurance expiry must be YYYY-MM-DD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          vehicle_type: vehicle.vehicleType,
          license_plate: plate,
          model_name: vehicle.modelName.trim(),
          insurance_expiry: vehicle.insuranceExpiry
        })
        .eq('id', user?.id);

      if (error) throw error;
      setStep('complete');
    } catch (err) {
      Alert.alert('Error', 'Failed to register vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  const inputClass =
    'h-12 border border-[#333] rounded-xl px-4 text-sm text-white bg-[#161616]';

  if (step === 'welcome') {
    return (
      <View className="flex-1 bg-[#111111] justify-center items-center px-8">
        <View className="w-24 h-24 rounded-full bg-amber-400 items-center justify-center mb-8">
          <Text className="text-4xl">🚖</Text>
        </View>
        <Text className="text-white text-3xl font-black tracking-tight text-center mb-3">
          Welcome to{'\n'}Namma Driver
        </Text>
        <Text className="text-gray-500 text-sm text-center leading-6 max-w-sm mb-10">
          Complete a quick one-time setup to verify your identity and register your vehicle. You'll be ready to earn in under 5 minutes.
        </Text>
        <TouchableOpacity
          onPress={handleStart}
          className="bg-amber-400 py-4 px-12 rounded-xl w-full max-w-xs items-center"
        >
          <Text className="text-[#111111] font-extrabold text-base">Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'kyc') {
    return (
      <View className="flex-1 bg-[#111111]">
        <View className="px-5 pt-14 pb-4">
          <Text className="text-white text-2xl font-black tracking-tight">Identity Verification</Text>
          <Text className="text-gray-500 text-xs font-semibold mt-1">Step 1 of 2 · KYC Documents</Text>
        </View>
        <StepIndicator current={0} total={2} />
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">Aadhaar Number</Text>
            <TextInput
              className={inputClass}
              placeholder="12-digit Aadhaar number"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              maxLength={12}
              value={docs.aadharNumber}
              onChangeText={(t) => setDocs((p) => ({ ...p, aadharNumber: t }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">Aadhaar Front Image URL</Text>
            <TextInput
              className={inputClass}
              placeholder="https://..."
              placeholderTextColor="#555"
              autoCapitalize="none"
              value={docs.aadharFrontUrl}
              onChangeText={(t) => setDocs((p) => ({ ...p, aadharFrontUrl: t }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">Aadhaar Back Image URL</Text>
            <TextInput
              className={inputClass}
              placeholder="https://..."
              placeholderTextColor="#555"
              autoCapitalize="none"
              value={docs.aadharBackUrl}
              onChangeText={(t) => setDocs((p) => ({ ...p, aadharBackUrl: t }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">Driving License Number</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. KA12 20150001234"
              placeholderTextColor="#555"
              value={docs.licenseNumber}
              onChangeText={(t) => setDocs((p) => ({ ...p, licenseNumber: t }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-5">
            <Text className="text-white text-sm font-bold mb-2">Driving License Image URL</Text>
            <TextInput
              className={inputClass}
              placeholder="https://..."
              placeholderTextColor="#555"
              autoCapitalize="none"
              value={docs.licenseFrontUrl}
              onChangeText={(t) => setDocs((p) => ({ ...p, licenseFrontUrl: t }))}
            />
          </View>
          <TouchableOpacity
            onPress={handleKycSubmit}
            disabled={isSubmitting}
            className={`py-4 rounded-xl items-center mb-8 ${isSubmitting ? 'bg-gray-800' : 'bg-amber-400'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text className="text-[#111111] text-sm font-extrabold">Continue to Vehicle Registration</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === 'vehicle') {
    return (
      <View className="flex-1 bg-[#111111]">
        <View className="px-5 pt-14 pb-4">
          <Text className="text-white text-2xl font-black tracking-tight">Vehicle Registration</Text>
          <Text className="text-gray-500 text-xs font-semibold mt-1">Step 2 of 2 · Vehicle Details</Text>
        </View>
        <StepIndicator current={1} total={2} />
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">Vehicle Type</Text>
          <View className="flex-row flex-wrap justify-between mb-4">
            {VEHICLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setVehicle((p) => ({ ...p, vehicleType: opt.key }))}
                className={`w-[48%] rounded-2xl p-4 mb-3 border ${
                  vehicle.vehicleType === opt.key
                    ? 'bg-amber-900/20 border-amber-500'
                    : 'bg-[#1e1e1e] border-[#2a2a2a]'
                }`}
              >
                <Text className="text-2xl mb-1">{opt.icon}</Text>
                <Text className={`text-sm font-bold ${vehicle.vehicleType === opt.key ? 'text-amber-300' : 'text-white'}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">License Plate</Text>
            <TextInput
              className={inputClass}
              placeholder="KA12AB1234"
              placeholderTextColor="#555"
              autoCapitalize="characters"
              maxLength={12}
              value={vehicle.licensePlate}
              onChangeText={(t) => setVehicle((p) => ({ ...p, licensePlate: t.toUpperCase() }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <Text className="text-white text-sm font-bold mb-2">Vehicle Model</Text>
            <TextInput
              className={inputClass}
              placeholder="e.g. Bajaj RE Compact"
              placeholderTextColor="#555"
              value={vehicle.modelName}
              onChangeText={(t) => setVehicle((p) => ({ ...p, modelName: t }))}
            />
          </View>
          <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-5">
            <Text className="text-white text-sm font-bold mb-2">Insurance Expiry (YYYY-MM-DD)</Text>
            <TextInput
              className={`${inputClass} font-mono`}
              placeholder="2026-12-31"
              placeholderTextColor="#555"
              maxLength={10}
              value={vehicle.insuranceExpiry}
              onChangeText={(t) => setVehicle((p) => ({ ...p, insuranceExpiry: t }))}
            />
          </View>
          <TouchableOpacity
            onPress={handleVehicleSubmit}
            disabled={isSubmitting}
            className={`py-4 rounded-xl items-center mb-8 ${isSubmitting ? 'bg-gray-800' : 'bg-amber-400'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text className="text-[#111111] text-sm font-extrabold">Complete Registration</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#111111] justify-center items-center px-8">
      <View className="w-24 h-24 rounded-full bg-emerald-900/30 border-2 border-emerald-500 items-center justify-center mb-8">
        <Text className="text-4xl">✓</Text>
      </View>
      <Text className="text-white text-3xl font-black tracking-tight text-center mb-3">
        You're All Set!
      </Text>
      <Text className="text-gray-500 text-sm text-center leading-6 max-w-sm mb-10">
        Your KYC documents have been submitted for review and your vehicle is registered. You can now go online and start accepting rides from the dashboard.
      </Text>
      <TouchableOpacity
        onPress={handleFinish}
        className="bg-amber-400 py-4 px-12 rounded-xl w-full max-w-xs items-center"
      >
        <Text className="text-[#111111] font-extrabold text-base">Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
