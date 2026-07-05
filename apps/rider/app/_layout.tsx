import { useEffect, useCallback, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from '@expo-google-fonts/karla';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { useTheme } from '../src/hooks/useTheme';
import { useAppStore } from '../src/stores/app-store';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) router.replace('/(auth)/login');
    else if (isAuthenticated && inAuthGroup) router.replace('/(tabs)/home');
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="track"
        options={{
          headerShown: true,
          headerTitle: 'Live Tracking',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: '800' },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="sos"
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="payment"
        options={{
          headerShown: true,
          headerTitle: 'Payment',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: '800' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const loadPreferences = useAppStore((s) => s.loadPreferences);

  const [fontsLoaded] = useFonts({
    Karla_400Regular: require('@expo-google-fonts/karla/400Regular/Karla_400Regular.ttf'),
    Karla_500Medium: require('@expo-google-fonts/karla/500Medium/Karla_500Medium.ttf'),
    Karla_600SemiBold: require('@expo-google-fonts/karla/600SemiBold/Karla_600SemiBold.ttf'),
    Karla_700Bold: require('@expo-google-fonts/karla/700Bold/Karla_700Bold.ttf'),
    Karla_800ExtraBold: require('@expo-google-fonts/karla/800ExtraBold/Karla_800ExtraBold.ttf'),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([SplashScreen.preventAutoHideAsync(), loadPreferences()]);
      } catch {} finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, [loadPreferences]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      try { await SplashScreen.hideAsync(); } catch {}
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View className="flex-1 bg-surface-container-lowest items-center justify-center" onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color="#692727" />
        <Text className="text-on-surface-variant text-label-md mt-4" style={{ letterSpacing: 0.5 }}>
          Namma Yatri
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-container-lowest" onLayout={onLayoutRootView}>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </AuthProvider>
    </View>
  );
}
