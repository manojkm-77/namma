import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@namma/api';

export default function RiderVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(57);
  const [success, setSuccess] = useState(false);

  const phoneNumber = params.phoneNumber as string;
  const fullName = params.fullName as string;
  const lastFour = phoneNumber ? `··· ${phoneNumber.slice(-4)}` : '··· 0000';

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText.substring(cleanText.length - 1);
    setOtp(newOtp);

    if (cleanText.length > 0 && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newOtp.every(d => d.length === 1)) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (otpString?: string) => {
    const code = otpString ?? otp.join('');
    if (code.length !== 6) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: 'sms',
      });

      if (error) {
        Alert.alert('Verification Failed', error.message);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          phone_number: phoneNumber,
          full_name: fullName,
          role: 'rider',
          updated_at: new Date().toISOString(),
        });

        setSuccess(true);
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1500);
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
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        setTimer(57);
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone.');
      }
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `(${m}:${s})`;
  };

  if (success) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-margin-mobile">
        <Animated.View className="items-center">
          <View className="w-24 h-24 rounded-full bg-secondary-container/20 items-center justify-center mb-lg">
            <Text className="text-6xl">✅</Text>
          </View>
          <Text className="font-headline text-primary text-center">Shubha Prayana!</Text>
          <Text className="font-body text-on-surface-variant text-center mt-sm">
            Redirecting you to your journey...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Trust Badges */}
      <View className="pt-xl px-margin-mobile flex flex-row items-center justify-center gap-xl opacity-60">
        <View className="flex flex-col items-center gap-xs">
          <View className="w-12 h-12 rounded-full bg-surface-container-high items-center justify-center">
            <Text className="text-xl">🔒</Text>
          </View>
          <Text className="text-label-sm uppercase tracking-wider">Secure</Text>
        </View>
        <View className="flex flex-col items-center gap-xs">
          <View className="w-12 h-12 rounded-full bg-surface-container-high items-center justify-center">
            <Text className="text-xl">🛡️</Text>
          </View>
          <Text className="text-label-sm uppercase tracking-wider">Encrypted</Text>
        </View>
        <View className="flex flex-col items-center gap-xs">
          <View className="w-12 h-12 rounded-full bg-surface-container-high items-center justify-center">
            <Text className="text-xl">✓</Text>
          </View>
          <Text className="text-label-sm uppercase tracking-wider">Trusted</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-grow items-center justify-center px-margin-mobile py-xl">
        <View className="w-full max-w-md">
          {/* Branding / Illustration */}
          <View className="mb-xl text-center">
            <View className="inline-flex items-center justify-center p-md bg-secondary-container rounded-xl mb-md">
              <Text className="text-4xl">🔓</Text>
            </View>
            <Text className="font-headline text-headline-lg-mobile text-primary mb-xs">
              OTP Verification
            </Text>
            <Text className="font-body text-on-surface-variant max-w-[280px] mx-auto">
              We've sent a 6-digit code to your registered mobile ending in{' '}
              <Text className="font-bold text-on-surface">{lastFour}</Text>
            </Text>
          </View>

          {/* OTP Card */}
          <View className="bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant p-xl">
            {/* OTP Input Grid */}
            <View className="flex flex-row justify-center gap-md mb-xl">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  className="w-12 h-14 text-center font-headline bg-surface-container-low border-2 border-transparent rounded-lg"
                  style={{
                    borderColor: digit ? '#feae2c' : 'transparent',
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Resend Timer */}
            <View className="text-center mb-lg">
              <Text className="text-label-md text-on-surface-variant">
                Didn't receive code?{' '}
                <Text
                  onPress={handleResendOtp}
                  className={`font-bold ${timer > 0 ? 'opacity-50' : 'text-secondary'}`}
                >
                  Resend Code{' '}
                  {timer > 0 && (
                    <Text className="font-normal text-on-surface-variant">{formatTimer(timer)}</Text>
                  )}
                </Text>
              </Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => handleVerifyOtp()}
              disabled={isLoading || !otp.every(d => d.length === 1)}
              className="w-full bg-primary text-on-primary font-headline py-md rounded-full shadow-lg active:scale-[0.98] transition-transform"
              style={{ opacity: isLoading || !otp.every(d => d.length === 1) ? 0.7 : 1 }}
            >
              <Text className="font-headline text-center text-on-primary">
                {isLoading ? 'Verifying...' : 'Verify Account'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="py-xl px-margin-mobile text-center">
        <Text className="text-label-sm text-outline">Namma Yatri © 2024 • Built for Bharat</Text>
      </View>
    </View>
  );
}
