import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/lib/auth-context';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className="flex-1 justify-center items-center bg-surface-container-lowest">
      <ActivityIndicator size="large" color="#692727" />
    </View>
  );
}
