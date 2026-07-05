import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { apiFetch } from '../../src/lib/api';

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface DashboardData {
  driver: {
    name: string;
    rating: number;
    dutyStatus: 'offline' | 'online' | 'busy';
    isKycVerified: boolean;
    subscriptionExpiresAt: string | null;
    vehicle: {
      vehicleType: string;
      licensePlate: string;
      modelName: string;
    } | null;
    wallet: { balance: number };
  };
  todayStats: {
    ridesCompleted: number;
    grossEarnings: number;
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  accent: 'amber' | 'green' | 'navy' | 'rose';
}) {
  const bgMap = {
    amber: 'bg-amber-400',
    green: 'bg-emerald-500',
    navy: 'bg-[#1c1c1c]',
    rose: 'bg-rose-500'
  } as const;

  const textMap = {
    amber: 'text-amber-950',
    green: 'text-white',
    navy: 'text-white',
    rose: 'text-white'
  } as const;

  const subTextMap = {
    amber: 'text-amber-800',
    green: 'text-emerald-100',
    navy: 'text-gray-400',
    rose: 'text-rose-100'
  } as const;

  return (
    <View className={`${bgMap[accent]} p-4 rounded-2xl flex-1`} style={{ flex: 1, padding: 16, borderRadius: 16, marginHorizontal: 4 }}>
      <Text className={`text-xs font-bold uppercase tracking-wide ${subTextMap[accent]}`} style={{ fontSize: 11, fontWeight: '700' }}>
        {label}
      </Text>
      <Text className={`text-2xl font-black mt-1 tracking-tight ${textMap[accent]}`} style={{ fontSize: 24, fontWeight: '900', marginTop: 4 }}>
        {value}
      </Text>
      {sub && (
        <Text className={`text-[11px] mt-0.5 font-medium ${subTextMap[accent]}`} style={{ fontSize: 10, marginTop: 2 }}>{sub}</Text>
      )}
    </View>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: 14, color: star <= Math.round(rating) ? '#fbbf24' : '#4b5563', marginRight: 2 }}>
          ★
        </Text>
      ))}
      <Text style={{ color: '#9ca3af', fontSize: 12, marginLeft: 4, fontWeight: '600' }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function KycBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          marginRight: 6,
          backgroundColor: isVerified ? '#10b981' : '#ef4444'
        }}
      />
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          color: isVerified ? '#10b981' : '#ef4444'
        }}
      >
        {isVerified ? 'KYC Verified' : 'KYC Pending'}
      </Text>
    </View>
  );
}

function OnlineStatusIndicator({ isOnline }: { isOnline: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, pulseAnim]);

  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {isOnline && (
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            position: 'absolute',
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#10b981',
            opacity: 0.4
          }}
        />
      )}
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: isOnline ? '#10b981' : '#4b5563'
        }}
      />
    </View>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Data Fetch ──────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async () => {
    const result = await apiFetch<DashboardData>('/api/driver/dashboard');
    if (result.success) {
      setDashboardData(result.data);
      setIsOnline(result.data.driver.dutyStatus === 'online');
    } else {
      console.error('[Dashboard Fetch Error]:', (result as any).error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchDashboardData().finally(() => setIsLoading(false));
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, [fetchDashboardData]);

  // ─── Location Telemetry ───────────────────────────────────────────────────

  const startLocationBroadcast = useCallback(() => {
    if (locationIntervalRef.current) return;
    locationIntervalRef.current = setInterval(async () => {
      // Mock latitude & longitude around Mysuru City
      const result = await apiFetch('/api/driver/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: 12.2958, longitude: 76.6394 })
      });
      if (!result.success) {
        console.error('[Location Broadcast Fault]:', (result as any).error);
      }
    }, 5000);
  }, []);

  const stopLocationBroadcast = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopLocationBroadcast();
  }, [stopLocationBroadcast]);

  // ─── Status Toggle ────────────────────────────────────────────────────────

  const handleStatusToggle = useCallback(
    async (nextValue: boolean) => {
      if (isTogglingStatus) return;

      if (nextValue && !dashboardData?.driver.isKycVerified) {
        Alert.alert(
          'KYC Required',
          'Complete your KYC verification before going online.',
          [{ text: 'Go to KYC', onPress: () => router.push('/(tabs)/kyc') }, { text: 'Later' }]
        );
        return;
      }

      setIsTogglingStatus(true);
      const newStatus = nextValue ? 'online' : 'offline';

      const result = await apiFetch('/api/driver/status', {
        method: 'PUT',
        body: JSON.stringify({ dutyStatus: newStatus })
      });

      if (result.success) {
        setIsOnline(nextValue);
        if (nextValue) {
          startLocationBroadcast();
        } else {
          stopLocationBroadcast();
        }
      } else {
        Alert.alert('Status Update Failed', (result as any).error);
      }

      setIsTogglingStatus(false);
    },
    [isTogglingStatus, dashboardData, router, startLocationBroadcast, stopLocationBroadcast]
  );

  // ─── Skeleton Loader ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111111', padding: 24, paddingTop: 64 }}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={{ backgroundColor: '#1e1e1e', height: 64, borderRadius: 16, marginBottom: 12, opacity: 0.5 }} />
        ))}
      </View>
    );
  }

  const wallet = dashboardData?.driver.wallet;
  const todayStats = dashboardData?.todayStats;
  const driver = dashboardData?.driver;

  const subscriptionDaysLeft = driver?.subscriptionExpiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(driver.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: '#111111' }}>
      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
              Namma Ride Driver
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 4 }}>
              {driver?.name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.fullName ?? 'Driver'}
            </Text>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              {driver && (
                <View style={{ marginRight: 12 }}>
                  <RatingStars rating={driver.rating} />
                </View>
              )}
              {driver && <KycBadge isVerified={driver.isKycVerified} />}
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2d2d2d', padding: 12, borderRadius: 12 }}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fbbf24"
          />
        }
      >
        {/* ── Onboarding Prompt ── */}
        {driver && (
          <>
            {!driver.isKycVerified && (
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <View style={{ backgroundColor: 'rgba(127, 29, 29, 0.3)', borderWidth: 1, borderColor: '#ef4444', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 16 }}>📄</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
                      KYC Not Completed
                    </Text>
                    <Text style={{ color: '#fca5a5', fontSize: 11, lineHeight: 16 }}>
                      Submit your identity documents to go online and accept rides.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/kyc')}
                    style={{ backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {(!driver.vehicle || driver.vehicle.licensePlate.startsWith('TEMP-')) && driver.isKycVerified && (
              <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                <View style={{ backgroundColor: 'rgba(180, 83, 9, 0.2)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 16 }}>🚖</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
                      Vehicle Not Registered
                    </Text>
                    <Text style={{ color: '#fde68a', fontSize: 11, lineHeight: 16 }}>
                      Register your vehicle details before going online.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/vehicle')}
                    style={{ backgroundColor: '#f59e0b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Text style={{ color: '#111111', fontWeight: '800', fontSize: 11 }}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Online Toggle Card ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: isOnline ? 'rgba(6, 95, 70, 0.2)' : '#1e1e1e',
              borderColor: isOnline ? '#059669' : '#2a2a2a'
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <OnlineStatusIndicator isOnline={isOnline} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                    {isOnline ? 'You are Online' : 'You are Offline'}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                    {isOnline
                      ? 'Broadcasting live location · Accepting rides'
                      : 'Toggle to start accepting rides'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleStatusToggle}
                disabled={isTogglingStatus}
                trackColor={{ false: '#374151', true: '#059669' }}
                thumbColor={isOnline ? '#ffffff' : '#9ca3af'}
                ios_backgroundColor="#374151"
              />
            </View>
          </View>
        </View>

        {/* ── Today's Earnings Row ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            Today's Performance
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#fbbf24', padding: 16, borderRadius: 16, marginRight: 8 }}>
              <Text style={{ color: '#78350f', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Gross Earnings</Text>
              <Text style={{ color: '#78350f', fontSize: 24, fontWeight: '900', marginTop: 4 }}>
                ₹{(todayStats?.grossEarnings ?? 0).toFixed(0)}
              </Text>
              <Text style={{ color: '#78350f', fontSize: 10, marginTop: 2 }}>Before any deductions</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#10b981', padding: 16, borderRadius: 16, marginLeft: 8 }}>
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>Rides Done</Text>
              <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '900', marginTop: 4 }}>
                {(todayStats?.ridesCompleted ?? 0).toString()}
              </Text>
              <Text style={{ color: '#ecfdf5', fontSize: 10, marginTop: 2 }}>Completed today</Text>
            </View>
          </View>
        </View>

        {/* ── Wallet Card ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a', padding: 20, borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Wallet Balance
                </Text>
                <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
                  ₹{(wallet?.balance ?? 0).toFixed(2)}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 10, marginTop: 4 }}>
                  Platform fee: ₹5 per completed ride
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#fbbf24', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 8 }}
                  onPress={() => router.push('/(tabs)/wallet')}
                >
                  <Text style={{ color: '#111111', fontWeight: '700', fontSize: 13 }}>Top Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ borderColor: '#374151', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}
                  onPress={() => router.push('/(tabs)/wallet')}
                >
                  <Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 13 }}>History</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(wallet?.balance ?? 0) < 20 && (
              <View style={{ marginTop: 16, backgroundColor: 'rgba(127, 29, 29, 0.4)', borderWidth: 1, borderColor: '#ef4444', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: '#ef4444', marginRight: 8 }}>⚠️</Text>
                <Text style={{ color: '#fca5a5', fontSize: 12, fontWeight: '600', flex: 1 }}>
                  Low balance. Top up to keep accepting rides without interruption.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Vehicle & Subscription Info ── */}
        {driver?.vehicle && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: '#6b7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              Vehicle & Subscription
            </Text>
            <View style={{ backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a', padding: 20, borderRadius: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    Vehicle Type
                  </Text>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 }}>
                    {driver.vehicle.vehicleType}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    License Plate
                  </Text>
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 }}>
                    {driver.vehicle.licensePlate}
                  </Text>
                </View>
              </View>

              <View style={{ borderTopWidth: 1, borderColor: '#2a2a2a', paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                    Subscription
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', marginTop: 2, color: subscriptionDaysLeft > 5 ? '#10b981' : '#fbbf24' }}>
                    {subscriptionDaysLeft} Days Remaining
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
                  onPress={() => router.push('/(tabs)/wallet')}
                >
                  <Text style={{ color: '#fbbf24', fontWeight: '700', fontSize: 12 }}>Renew</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── Sign Out Button ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={async () => {
              await signOut();
              router.replace('/(auth)');
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
