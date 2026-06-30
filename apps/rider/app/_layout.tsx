import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import '../global.css';

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign-in page if not authenticated and not in auth screens
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated and trying to access auth screens
      router.replace('/(tabs)/home');
    }
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
          headerStyle: { backgroundColor: '#f8f8f8' },
          headerTintColor: '#1c1c1c',
          headerTitleStyle: { fontWeight: '800' },
          presentation: 'card'
        }}
      />
      <Stack.Screen
        name="sos"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          headerShown: true,
          headerTitle: 'Complete Payment',
          headerStyle: { backgroundColor: '#f8f8f8' },
          headerTintColor: '#1c1c1c',
          headerTitleStyle: { fontWeight: '800' }
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor="#f8f8f8" />
      <AuthGate />
    </AuthProvider>
  );
}

