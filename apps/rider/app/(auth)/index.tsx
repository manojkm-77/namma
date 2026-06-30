import React, { useState } from 'react';
import { View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';
import { Button, Text, Card, theme } from '@namma/ui';

export default function RiderLoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmedPhone = phoneNumber.trim().replace(/\s+/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name to proceed.');
      return;
    }

    const formattedPhone = `+91${trimmedPhone}`;
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        Alert.alert('Failed to send OTP', error.message);
      } else {
        router.push({
          pathname: '/(auth)/verify',
          params: { phoneNumber: formattedPhone, fullName: fullName.trim() }
        });
      }
    } catch (err) {
      console.error('[signInWithOtp Exception]:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <Card className="p-6 border border-gray-100 shadow-lg">
        <View className="mb-8">
          <Text className="text-3xl font-black text-secondary tracking-tight">
            🚖 Namma Rider
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            Fast, direct, and zero-commission rides in Karnataka
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
            Your Full Name
          </Text>
          <TextInput
            className="h-14 border border-gray-200 rounded-xl px-4 text-base text-secondary bg-gray-50"
            placeholder="e.g. Ramesh Gowda"
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-2">
            Mobile Number
          </Text>
          <View className="flex-row items-center">
            <View className="h-14 border border-gray-200 border-r-0 rounded-l-xl bg-gray-100 justify-center px-4">
              <Text className="text-base font-semibold text-secondary">+91</Text>
            </View>
            <TextInput
              className="flex-1 h-14 border border-gray-200 rounded-r-xl px-4 text-base text-secondary bg-gray-50"
              placeholder="9876543210"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        <Button
          label="Get OTP Verification"
          onPress={handleSendOtp}
          disabled={isLoading}
        />
        {isLoading && (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
        )}
      </Card>
    </View>
  );
}
