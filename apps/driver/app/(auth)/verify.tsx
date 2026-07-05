import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@namma/api';
import { Button, Text, Card, theme } from '@namma/ui';

export default function DriverVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const phoneNumber = params.phoneNumber as string;
  const fullName = params.fullName as string;

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Tick the resend timer down
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText.substring(cleanText.length - 1); // Only keep the last digit
    setOtp(newOtp);

    // Auto-focus next field
    if (cleanText.length > 0 && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpString,
        type: 'sms',
      });

      if (error) {
        Alert.alert('Verification Failed', error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // 1. Explicitly upsert the user profile into public.users with role 'driver'
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            phone_number: phoneNumber,
            full_name: fullName,
            role: 'driver',
            updated_at: new Date().toISOString(),
          });

        if (userError) {
          console.error('[Verify Driver Profile Upsert Error]:', userError);
        }

        // 2. Explicitly upsert the driver details into public.drivers
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert({
            id: data.user.id,
            license_plate: `TEMP-${data.user.id.substring(0, 8)}`,
            vehicle_type: 'auto',
            is_active: false,
            duty_status: 'offline',
            is_kyc_verified: false,
            rating: 5.0,
            last_ping_at: new Date().toISOString(),
          });

        if (driverError) {
          console.error('[Verify Driver Profile Details Upsert Error]:', driverError);
        }

        // Redirect to onboarding flow for KYC + vehicle setup
        router.replace('/onboarding');
      }
    } catch (err) {
      console.error('[verifyOtp Exception]:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        setTimer(30);
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
      }
    } catch (err) {
      console.error('[resendOtp Exception]:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <Card className="p-6 border border-gray-100 shadow-lg">
        <View className="mb-8">
          <Text className="text-3xl font-black text-secondary tracking-tight">
            Verification
          </Text>
          <Text className="text-sm text-gray-500 mt-2">
            Enter the 6-digit code sent to {phoneNumber}
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-4">
            Verification Code
          </Text>
          <View className="flex-row justify-between">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                className="w-11 h-14 border border-gray-200 rounded-xl text-center text-xl font-bold text-secondary bg-gray-50"
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>
        </View>

        <Button
          label="Verify and Continue"
          onPress={handleVerifyOtp}
          disabled={isLoading}
        />

        {isLoading && (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
        )}

        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-sm text-gray-500">Didn't receive the OTP? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0}>
            <Text
              className={`text-sm font-semibold ${
                timer > 0 ? 'text-gray-400' : 'text-primary'
              }`}
            >
              {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-gray-500 font-semibold underline">
            Change Phone Number
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
}
