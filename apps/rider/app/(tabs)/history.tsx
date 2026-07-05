import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { fetchRideHistory } from '../../src/services/ride-service';
import { RideCard } from '../../src/components/ui/RideCard';
import { LoadingScreen } from '../../src/components/ui/LoadingScreen';
import { ErrorScreen } from '../../src/components/ui/ErrorScreen';
import { EmptyState } from '../../src/components/ui/EmptyState';
import type { RideHistoryItem, RideStatus } from '../../src/types';

const FILTERS: { key: RideStatus | 'all'; labelEn: string; labelKn: string }[] = [
  { key: 'all', labelEn: 'All', labelKn: 'ಎಲ್ಲಾ' },
  { key: 'completed', labelEn: 'Completed', labelKn: 'ಪೂರ್ಣಗೊಂಡಿದೆ' },
  { key: 'cancelled', labelEn: 'Cancelled', labelKn: 'ರದ್ದಾಗಿದೆ' },
  { key: 'requested', labelEn: 'Scheduled', labelKn: 'ನಿಗದಿತ' },
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();

  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RideStatus | 'all'>('all');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchRideHistory(user.id);
      setRides(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load ride history');
    }
  }, [user?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const filteredRides = useMemo(() => {
    if (activeFilter === 'all') return rides;
    return rides.filter((r) => r.status === activeFilter);
  }, [rides, activeFilter]);

  const handleRepeatRide = useCallback((ride: RideHistoryItem) => {
    Alert.alert('Repeat Ride', `Booking from ${ride.pickupAddress} to ${ride.dropAddress}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Book Now', onPress: () => router.push('/(tabs)/home') },
    ]);
  }, [router]);

  const handleRateDriver = useCallback((ride: RideHistoryItem) => {
    const stars = [1, 2, 3, 4, 5] as const;
    Alert.alert('Rate Driver', `Rate ${ride.driverName || 'your driver'}`, [
      ...stars.map((s) => ({
        text: `${'⭐'.repeat(s)} ${s}`,
        onPress: () => Alert.alert('Thanks!', `You rated ${ride.driverName || 'your driver'} ${s} star${s > 1 ? 's' : ''}.`),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, []);

  if (isLoading) return <LoadingScreen message={t('common.loading')} />;

  if (error) return <ErrorScreen message={error} onRetry={() => { setIsLoading(true); fetchData().finally(() => setIsLoading(false)); }} />;

  return (
    <View className="flex-1 bg-background">
      {/* Top App Bar */}
      <View className="pt-16 px-margin-mobile pb-sm">
        <Text className="text-on-surface font-headline" style={{ fontSize: 26, letterSpacing: -0.5 }}>
          {t('history.title')}
        </Text>
        <Text className="text-on-surface-variant text-label-sm mt-xs">
          {rides.length > 0 ? `${rides.length} ride${rides.length === 1 ? '' : 's'}` : t('history.empty')}
        </Text>
      </View>

      {/* Filter Chips */}
      <View className="px-margin-mobile mb-md">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`px-lg py-sm rounded-full border ${
                activeFilter === filter.key
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-outline'
              }`}
            >
              <Text className={`text-label-sm font-bold ${
                activeFilter === filter.key ? 'text-on-primary' : 'text-on-surface-variant'
              }`}>
                {language === 'kn' ? filter.labelKn : filter.labelEn}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredRides.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t('history.empty')}
          description={language === 'kn' ? 'ನಿಮ್ಮ ಮೊದಲ ಸವಾರಿಯ ನಂತರ ಇತಿಹಾಸ ಕಾಣಿಸುತ್ತದೆ' : 'Your trip history will appear here after your first ride'}
        />
      ) : (
        <ScrollView
          className="flex-1 px-margin-mobile"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#692727" colors={["#692727"]} />
          }
        >
          {filteredRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onRepeat={handleRepeatRide}
              onRate={handleRateDriver}
            />
          ))}
          <View className="h-12" />
        </ScrollView>
      )}
    </View>
  );
}
