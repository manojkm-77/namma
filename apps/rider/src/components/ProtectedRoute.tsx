import React, { useEffect, type ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../lib/auth-context';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'rider' | 'driver' | 'admin'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
      return;
    }

    if (isAuthenticated && allowedRoles && user) {
      const hasPermission = allowedRoles.includes(user.role as 'rider' | 'driver' | 'admin');
      if (!hasPermission) {
        router.replace('/(tabs)/home');
      }
    }
  }, [isAuthenticated, isLoading, segments, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f8f8', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#863d3c" />
        <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 12, fontWeight: '500' }}>Loading session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
