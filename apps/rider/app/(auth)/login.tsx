import { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';

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
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-margin-mobile pt-xl pb-lg flex flex-col items-center text-center">
        <View className="absolute top-0 left-0 w-full h-64 bg-secondary-container/10 -z-10" />
        <View className="mb-lg mt-base items-center">
          <Text className="font-headline text-headline-lg-mobile text-primary mb-xs">
            Welcome to Namma Yatri
          </Text>
          <Text className="font-body text-on-surface-variant font-medium">Namaskara! 👋</Text>
        </View>

        {/* Brand Icon - Auto Rickshaw */}
        <View className="w-48 h-48 relative flex items-center justify-center bg-secondary-container/20 rounded-full mb-lg">
          <Text className="text-8xl">🛺</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-grow px-margin-mobile pb-2xl max-w-md mx-auto w-full">
        {/* Sign In Card */}
        <View className="bg-surface-container-lowest rounded-xl p-lg shadow-soft border border-surface-variant/30">
          <View className="mb-lg">
            <Text className="font-headline text-headline-md text-primary mb-xs">Sign In</Text>
            <Text className="text-label-md text-on-surface-variant">Enter your mobile number to get started</Text>
          </View>

          {/* Full Name Input */}
          <View className="mb-md">
            <Text className="text-label-sm text-on-surface-variant mb-sm">Your Full Name</Text>
            <TextInput
              className="bg-surface-container-low border-2 border-transparent focus:border-secondary-container rounded-lg px-4 py-3 font-body text-on-surface placeholder:text-outline"
              placeholder="e.g. Arjun Gowda"
              placeholderTextColor="#877271"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Mobile Input Block */}
          <View className="flex flex-row items-center gap-md p-md bg-surface-container-low rounded-lg border-2 border-transparent focus:border-secondary-container mb-lg">
            <View className="flex flex-row items-center gap-xs border-r border-outline-variant pr-md">
              <Text className="font-bold text-on-surface-variant font-body">+91</Text>
            </View>
            <TextInput
              className="bg-transparent border-none focus:ring-0 flex-1 font-headline text-headline-md text-on-surface placeholder:text-on-surface-variant/40"
              maxLength={10}
              placeholder="Mobile Number"
              placeholderTextColor="#877271"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
            />
          </View>

          {/* Primary CTA */}
          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={isLoading}
            className="w-full bg-primary text-on-primary py-md rounded-full font-bold flex items-center justify-center gap-sm active:scale-95 transition-transform shadow-lg"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <Text className="text-label-md uppercase tracking-wider text-on-primary">
              {isLoading ? 'Sending...' : 'Get OTP'}
            </Text>
            {!isLoading && <Text className="text-xl">→</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex flex-row items-center my-xl">
            <View className="flex-grow h-[1px] bg-outline-variant" />
            <Text className="px-md text-label-sm text-on-surface-variant">Connect with</Text>
            <View className="flex-grow h-[1px] bg-outline-variant" />
          </View>

          {/* Alternative Login Options */}
          <View className="flex flex-row gap-md">
            <TouchableOpacity className="flex-1 flex flex-col items-center justify-center p-md bg-surface-container rounded-lg border border-transparent active:scale-95 transition-colors">
              <Text className="text-2xl mb-xs">📧</Text>
              <Text className="text-label-sm text-on-surface">Email</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 flex flex-col items-center justify-center p-md bg-surface-container rounded-lg border border-transparent active:scale-95 transition-colors">
              <Text className="text-2xl mb-xs">🏢</Text>
              <Text className="text-label-sm text-on-surface">Enterprise</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Account Link */}
        <View className="mt-xl text-center">
          <Text className="text-label-md text-on-surface-variant">
            New to Namma Yatri?{' '}
            <Text className="text-primary font-bold underline underline-offset-4 decoration-secondary-container decoration-2">
              Create Account
            </Text>
          </Text>
        </View>

        {/* Trust Signal */}
        <View className="mt-2xl flex flex-row items-center justify-center gap-xs opacity-60">
          <Text className="text-label-sm">🔒 100% Direct Driver Payments</Text>
        </View>
      </View>

      {/* Footer Decoration */}
      <View className="w-full h-1 bg-gradient-to-r from-secondary-container via-primary to-secondary-container" />
    </View>
  );
}
