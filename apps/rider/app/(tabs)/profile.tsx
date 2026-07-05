import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';
import { useAuth } from '../../src/lib/auth-context';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAppStore } from '../../src/stores/app-store';
import { SkeletonCard } from '../../src/components/ui/SkeletonBlock';
import type { RideStats, LoyaltyTier } from '../../src/types';

const TIERS: LoyaltyTier[] = [
  { name: 'Platinum Rider', nameKn: 'ಪ್ಲಾಟಿನಂ ರೈಡರ್', badge: '⭐', color: '#835500', bgColor: '#feae2c', minRides: 100, benefits: ['Priority support', 'Extra discounts', 'Free cancellation'] },
  { name: 'Gold Rider', nameKn: 'ಗೋಲ್ಡ್ ರೈಡರ್', badge: '🥇', color: '#92400E', bgColor: '#fef3c7', minRides: 50, benefits: ['Priority support', 'Weekend discounts'] },
  { name: 'Silver Rider', nameKn: 'ಸಿಲ್ವರ್ ರೈಡರ್', badge: '🥈', color: '#4B5563', bgColor: '#f3f4f6', minRides: 10, benefits: ['Loyalty discounts'] },
  { name: 'Bronze Rider', nameKn: 'ಬ್ರಾಂಜ್ ರೈಡರ್', badge: '🟤', color: '#92400E', bgColor: '#fef3c7', minRides: 0, benefits: ['Welcome benefits'] },
];

function determineTier(rides: number): LoyaltyTier {
  for (const tier of TIERS) { if (rides >= tier.minRides) return tier; }
  return TIERS[TIERS.length - 1];
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  const setLanguage = useAppStore((s) => s.setLanguage);
  const walletBalance = useAppStore((s) => s.walletBalance) ?? 2840;

  const [stats, setStats] = useState<RideStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: rideData } = await supabase
        .from('rides')
        .select('fare_amount, distance_km, created_at, status')
        .eq('rider_id', user.id);

      if (rideData) {
        const completed = rideData.filter((r) => r.status === 'completed');
        const cancelled = rideData.filter((r) => r.status === 'cancelled');
        const sorted = [...rideData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setStats({
          totalRides: completed.length,
          totalDistanceKm: completed.reduce((s, r) => s + (r.distance_km ?? 0), 0),
          totalSpent: completed.reduce((s, r) => s + (r.fare_amount ?? 0), 0),
          memberSince: sorted[0]?.created_at ?? new Date().toISOString(),
          cancelledRides: cancelled.length,
          rating: 4.92,
        });
      }
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { Promise.all([fetchData()]).finally(() => setIsLoading(false)); }, [fetchData]);

  const handleRefresh = useCallback(async () => { setIsRefreshing(true); await fetchData(); setIsRefreshing(false); }, [fetchData]);

  const handleSignOut = useCallback(() => {
    Alert.alert(t('profile.logout'), 'Are you sure?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); }},
    ]);
  }, [signOut, router, t]);

  const tier = stats ? determineTier(stats.totalRides) : TIERS[0];
  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.fullName ?? 'Arjun K. Rao';
  const displayPhone = user?.phone ?? '+91 XXXXX XXXXX';
  const memberDate = stats ? new Date(stats.memberSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <View className="flex-1 bg-background">
      {/* Top App Bar */}
      <View className="fixed top-0 w-full z-40 bg-background h-16 flex flex-row justify-between items-center px-margin-mobile">
        <View className="flex flex-row items-center gap-4">
          <View className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
            <Text className="text-xl text-center pt-1">👤</Text>
          </View>
          <View>
            <Text className="font-headline text-primary leading-tight">Account Profile</Text>
            <Text className="text-label-sm text-on-surface-variant">{displayName}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Notifications')} className="w-10 h-10 items-center justify-center">
          <Text className="text-xl">🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="pt-20 px-margin-mobile"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#692727" colors={["#692727"]} />
        }
      >
        {/* Language Toggle */}
        <View className="flex bg-surface-container rounded-full p-1 w-fit mx-auto shadow-soft mb-lg">
          <TouchableOpacity
            onPress={() => setLanguage('en')}
            className={`px-6 py-2 rounded-full text-label-md ${language === 'en' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}
          >
            <Text className="text-label-md">English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage('kn')}
            className={`px-6 py-2 rounded-full text-label-md ${language === 'kn' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'}`}
          >
            <Text className="text-label-md">ಕನ್ನಡ</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
        ) : (
          <>
            {/* Milestone Card */}
            <View className="bg-surface-container-lowest rounded-xl p-lg shadow-soft border border-surface-variant/30 mb-lg">
              <View className="flex flex-row justify-between items-start mb-md">
                <View>
                  <Text className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Member Since {memberDate.split(' ')[memberDate.split(' ').length - 1] || '2022'}
                  </Text>
                  <Text className="font-headline text-on-surface mt-1">{tier.name}</Text>
                </View>
                <View className="w-12 h-12 bg-secondary-container rounded-full items-center justify-center shadow-lg">
                  <Text className="text-2xl">{tier.badge}</Text>
                </View>
              </View>
              <View className="space-y-sm">
                <View className="flex flex-row justify-between text-label-sm">
                  <Text className="text-on-surface-variant">Next Reward: 50% Off Ride</Text>
                  <Text className="text-primary font-bold">84%</Text>
                </View>
                <View className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                  <View className="h-full bg-secondary-container rounded-full" style={{ width: '84%' }} />
                </View>
                <Text className="text-on-surface-variant text-[12px] italic">"Keep riding to unlock your next big discount!"</Text>
              </View>
            </View>

            {/* Stats Bento */}
            <View className="flex flex-row gap-md mb-lg">
              <View className="flex-1 bg-surface-container-lowest p-md rounded-xl shadow-soft border border-surface-variant/30 aspect-square items-center">
                <View className="w-8 h-8 rounded-lg bg-primary-fixed items-center justify-center mb-auto">
                  <Text className="text-base">🚗</Text>
                </View>
                <View className="mt-auto">
                  <Text className="text-label-sm text-on-surface-variant">Total Rides</Text>
                  <Text className="font-headline text-on-surface">{stats?.totalRides ?? 142}</Text>
                </View>
              </View>
              <View className="flex-1 bg-surface-container-lowest p-md rounded-xl shadow-soft border border-surface-variant/30 aspect-square items-center">
                <View className="w-8 h-8 rounded-lg bg-secondary-fixed items-center justify-center mb-auto">
                  <Text className="text-base">⭐</Text>
                </View>
                <View className="mt-auto">
                  <Text className="text-label-sm text-on-surface-variant">Avg Rating</Text>
                  <Text className="font-headline text-on-surface">{stats?.rating?.toFixed(2) ?? '4.92'}</Text>
                </View>
              </View>
            </View>

            {/* Wallet Card */}
            <TouchableOpacity
              onPress={() => Alert.alert('Wallet', 'Balance: ₹' + walletBalance.toFixed(0))}
              className="bg-primary text-on-primary rounded-xl p-lg shadow-soft relative overflow-hidden mb-lg active:scale-[0.98] transition-transform"
            >
              <View className="absolute -right-8 -top-8 w-32 h-32 bg-on-primary-container/10 rounded-full" />
              <View className="relative z-10 flex flex-col">
                <View className="flex flex-row justify-between items-center mb-xl">
                  <Text className="text-label-md text-on-primary-container">Wallet Balance</Text>
                  <Text className="text-2xl">👛</Text>
                </View>
                <View>
                  <Text className="font-headline text-on-primary tracking-tight">₹{walletBalance.toFixed(0)}</Text>
                  <Text className="text-label-sm text-on-primary-container/80 mt-1">Ready for your next trip</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Identity Module */}
            <View className="bg-surface-container-low rounded-xl p-md border border-outline-variant/30 mb-lg">
              <View className="flex flex-row items-center gap-3 mb-md">
                <Text className="text-xl">✅</Text>
                <Text className="text-label-md text-on-surface">Identity Verified</Text>
              </View>
              <View className="space-y-sm">
                <View className="flex flex-row justify-between items-center py-2 border-b border-surface-variant/50">
                  <Text className="text-on-surface-variant text-label-sm">Aadhaar Card</Text>
                  <Text className="text-on-surface text-label-md tracking-widest">XXXX XXXX 5821</Text>
                </View>
                <View className="flex flex-row justify-between items-center py-2">
                  <Text className="text-on-surface-variant text-label-sm">Phone Number</Text>
                  <Text className="text-on-surface text-label-md">{displayPhone}</Text>
                </View>
              </View>
            </View>

            {/* Settings List */}
            <View className="space-y-sm mb-24">
              {[
                { icon: '⚙️', label: 'App Settings', action: () => Alert.alert('Settings') },
                { icon: '💳', label: 'Payment Methods', action: () => router.push('/payment') },
                { icon: '🆘', label: 'Emergency Contacts', action: () => router.push('/sos') },
                { icon: '❓', label: 'Help & Support', action: () => Alert.alert('Support', 'Contact: support@nammaride.com') },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.action}
                  className="w-full flex flex-row items-center justify-between p-md bg-surface-container-lowest rounded-xl shadow-soft border border-surface-variant/20 active:scale-[0.98] transition-transform"
                >
                  <View className="flex flex-row items-center gap-md">
                    <View className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center">
                      <Text className="text-lg">{item.icon}</Text>
                    </View>
                    <Text className="text-label-md text-on-surface">{item.label}</Text>
                  </View>
                  <Text className="text-on-surface-variant text-xl">›</Text>
                </TouchableOpacity>
              ))}

              {/* Sign Out */}
              <TouchableOpacity
                onPress={handleSignOut}
                className="w-full flex flex-row items-center p-md bg-error-container/20 rounded-xl border border-error/10 mt-xl active:scale-[0.98] transition-transform"
              >
                <View className="w-10 h-10 rounded-full bg-error/10 items-center justify-center mr-md">
                  <Text className="text-lg">🚪</Text>
                </View>
                <Text className="text-label-md font-bold text-error">Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="text-center pt-xl pb-2xl">
              <Text className="text-label-sm text-on-surface-variant opacity-60">Namma Yatri v5.0.0 • Made in India</Text>
              <Text className="text-label-sm text-on-surface-variant mt-2">Shubha Prayana!</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex flex-row justify-around items-center px-4 pb-4 pt-2">
        <TouchableOpacity onPress={() => router.push('/(tabs)/home')} className="flex flex-col items-center text-on-surface-variant px-4 py-1.5">
          <Text className="text-xl">🏠</Text>
          <Text className="text-label-sm">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/history')} className="flex flex-col items-center text-on-surface-variant px-4 py-1.5">
          <Text className="text-xl">📋</Text>
          <Text className="text-label-sm">Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/sos')} className="flex flex-col items-center text-on-surface-variant px-4 py-1.5">
          <Text className="text-xl">🛡️</Text>
          <Text className="text-label-sm">Safety</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-xl px-4 py-1.5">
          <Text className="text-xl">👤</Text>
          <Text className="text-label-sm font-bold">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
