import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch {
        // silently handle
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // silently handle
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return (
      <View className="flex-1 bg-[#111111] items-center justify-center" onLayout={onLayoutRootView}>
        <ActivityIndicator size="large" color="#fbbf24" />
        <Text className="text-gray-500 text-sm font-semibold mt-4 tracking-wide">
          Loading Namma Driver...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#111111]" onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" backgroundColor="#111111" />
          <AuthGate />
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}
