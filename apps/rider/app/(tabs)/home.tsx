import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, SafeAreaView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRideStore } from '../../src/stores/ride-store';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { LocationSearchSheet } from '../../src/components/ui/LocationSearchSheet';
import { VehicleSelector } from '../../src/components/ui/VehicleSelector';
import { DriverCard } from '../../src/components/ui/DriverCard';
import { useLocation } from '../../src/hooks/useLocation';
import { getSavedPlaces } from '../../src/services/location-service';
import { estimateDistance, estimateDuration } from '../../src/services/location-service';
import { VEHICLE_OPTIONS, calculateFare } from '../../src/services/ride-service';
import type { Location, SavedPlace } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { location: currentLocation, isLoading: locLoading } = useLocation();

  const {
    step, pickup, drop, selectedVehicle, activeRide,
    setStep, setPickup, setDrop, selectVehicle,
  } = useRideStore();

  const [showPickupSearch, setShowPickupSearch] = useState(false);
  const [showDropSearch, setShowDropSearch] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingFailures, setMatchingFailures] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const driverPositions = useRef(
    Array.from({ length: 3 }, () => ({
      latitude: (pickup?.latitude || 12.3) + (Math.random() - 0.5) * 0.02,
      longitude: (pickup?.longitude || 76.6) + (Math.random() - 0.5) * 0.02,
    })),
  ).current;

  useEffect(() => {
    getSavedPlaces().then(setSavedPlaces);
    if (!pickup && currentLocation) setPickup(currentLocation);
  }, [currentLocation]);

  useEffect(() => {
    if (isMatching) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
      return () => pulseAnim.setValue(1);
    }
  }, [isMatching]);

  const handleConfirmBooking = useCallback(() => {
    setIsMatching(true);
    setStep('matching');
  }, [setStep]);

  const handlePickupSelect = useCallback((location: Location) => {
    setPickup(location);
    setShowPickupSearch(false);
  }, [setPickup]);

  const handleDropSelect = useCallback((location: Location) => {
    setDrop(location);
    setShowDropSearch(false);
  }, [setDrop]);

  const handleCancelMatching = useCallback(() => {
    setIsMatching(false);
    setMatchingFailures(0);
    setStep('search');
  }, [setStep]);

  const handleRetryMatching = useCallback(() => {
    setMatchingFailures((c) => c + 1);
  }, []);

  const handleSos = useCallback(() => router.push('/sos'), [router]);
  const handlePayment = useCallback(() => {
    if (activeRide) {
      router.push({ pathname: '/payment', params: { fare: activeRide.fare?.finalFare || 120, rideId: activeRide.id } });
    } else {
      router.push('/payment');
    }
  }, [router, activeRide]);
  const handleTrack = useCallback(() => {
    if (pickup && drop) {
      router.push({ pathname: '/track', params: { pickupLat: pickup.latitude, pickupLng: pickup.longitude, dropLat: drop.latitude, dropLng: drop.longitude } });
    } else {
      router.push('/track');
    }
  }, [router, pickup, drop]);
  const handleCallDriver = useCallback((phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Call failed', 'Unable to make call'));
    else Alert.alert('Call driver', 'No phone number available');
  }, []);

  const defaultRegion = useMemo(() => ({
    latitude: currentLocation?.latitude || 12.3,
    longitude: currentLocation?.longitude || 76.6,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }), [currentLocation]);

  const fareEstimates = useMemo(() => {
    if (!pickup || !drop) return [];
    const dist = estimateDistance(pickup.latitude, pickup.longitude, drop.latitude, drop.longitude);
    const dur = estimateDuration(dist);
    return VEHICLE_OPTIONS.map(v => calculateFare(v, dist, dur));
  }, [pickup, drop]);

  const renderMapLayers = useMemo(() => (
    <>
      {currentLocation && (
        <Marker coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }} title="You" pinColor="#692727" />
      )}
      {pickup && pickup !== currentLocation && (
        <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} title="Pickup" pinColor="#10B981" />
      )}
      {drop && (
        <Marker coordinate={{ latitude: drop.latitude, longitude: drop.longitude }} title="Drop" pinColor="#DC2626" />
      )}
      {isMatching && driverPositions.map((pos, i) => (
        <Marker key={`driver-${i}`} coordinate={pos} title={`Driver ${i + 1}`}>
          <View className="w-10 h-10 rounded-full bg-secondary-container/30 items-center justify-center border-2 border-secondary-container">
            <Text className="text-lg">🛺</Text>
          </View>
        </Marker>
      ))}
    </>
  ), [currentLocation, pickup, drop, isMatching]);

  if (locLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Animated.View
          className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center"
          style={{ transform: [{ scale: pulseAnim }] }}
        >
          <Text className="text-4xl">📍</Text>
        </Animated.View>
        <Text className="text-label-md text-on-surface-variant mt-lg">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Map */}
      <MapView style={{ flex: 1 }} initialRegion={defaultRegion} showsUserLocation showsMyLocationButton showsTraffic rotateEnabled zoomEnabled scrollEnabled>
        {renderMapLayers}
      </MapView>

      {/* Stitch Design Header - shown in search step */}
      {step === 'search' && (
        <SafeAreaView className="absolute top-0 left-0 right-0" style={{ paddingTop: 44 }}>
          <View className="px-margin-mobile flex flex-row justify-between items-center mb-md">
            {/* User avatar + brand */}
            <View className="flex flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-surface-container-lowest overflow-hidden border-2 border-primary-fixed">
                <Text className="text-xl text-center pt-1">👤</Text>
              </View>
              <Text className="font-headline text-primary">Namma Yatri</Text>
            </View>
            {/* Notification bell */}
            <TouchableOpacity
              onPress={() => Alert.alert('Notifications', 'No new notifications')}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-xl">🔔</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Stitch Design - Search card overlay */}
      {step === 'search' && (
        <SafeAreaView className="absolute top-0 left-0 right-0" style={{ paddingTop: 110 }}>
          <View className="px-margin-mobile">
            <View className="bg-surface-container-lowest rounded-3xl p-md shadow-soft-lg border border-surface-variant/50">
              {/* Pickup/Drop row */}
              <View className="flex flex-row items-center gap-md mb-md">
                {/* Dots column */}
                <View className="flex flex-col items-center gap-1">
                  <View className="w-2.5 h-2.5 rounded-full border-2 border-primary" />
                  <View className="w-0.5 h-6 border-l border-dashed border-outline" />
                  <View className="w-2.5 h-2.5 bg-secondary-container rounded-sm" />
                </View>
                {/* Text inputs */}
                <View className="flex-1 flex flex-col gap-3">
                  <TouchableOpacity
                    onPress={() => setShowPickupSearch(true)}
                    className="text-label-md text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg"
                  >
                    <Text className="text-label-md text-on-surface-variant">
                      {pickup?.address || 'Current Location'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowDropSearch(true)}
                    className="bg-surface-container-low border-none rounded-lg px-3 py-3"
                  >
                    <Text className="font-body text-on-surface-variant">Where to?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Shortcuts */}
              <View className="flex flex-row gap-sm overflow-x-auto">
                {['Home', 'Work', '⭐ Namma Spot'].map((label, i) => (
                  <TouchableOpacity
                    key={label}
                    onPress={() => {
                      const place = savedPlaces.find(p => p.label.toLowerCase() === label.toLowerCase() || (label === 'Home' && p.type === 'home') || (label === 'Work' && p.type === 'work'));
                      if (place && label !== '⭐ Namma Spot') {
                        handleDropSelect({ latitude: place.latitude, longitude: place.longitude, address: place.address, label: place.label });
                      } else if (label === '⭐ Namma Spot') {
                        setShowDropSearch(true);
                      }
                    }}
                    className={`flex flex-row items-center gap-xs px-4 py-2 rounded-full text-label-md whitespace-nowrap ${i === 2 ? 'bg-secondary-container text-on-secondary-container shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}
                  >
                    <Text className="text-base">{i === 0 ? '🏠' : i === 1 ? '💼' : '⭐'}</Text>
                    <Text className={`text-label-sm ${i === 2 ? 'text-on-secondary-container' : ''}`}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Promo Floating Card */}
      {step === 'search' && (
        <View className="absolute left-margin-mobile right-margin-mobile" style={{ top: 260 }}>
          <TouchableOpacity className="relative h-40 rounded-3xl overflow-hidden shadow-lg">
            <View className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 z-10 p-lg flex flex-col justify-center">
              <Text className="font-headline text-on-primary">Safe Rides</Text>
              <Text className="font-body text-on-primary max-w-[200px] mt-1">Verified drivers & 24/7 safety support for every journey.</Text>
              <TouchableOpacity className="mt-3 w-fit px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full shadow-sm">
                <Text className="text-label-sm text-sm">Learn More</Text>
              </TouchableOpacity>
            </View>
            <View className="absolute inset-0 bg-gray-300">
              <Text className="text-center pt-8 text-gray-500 text-sm">City street illustration</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Action Bar - Search Step */}
      {step === 'search' && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="px-margin-mobile pb-4 pt-2">
            {/* Active Ride OTP Banner */}
            {activeRide && (
              <View className="bg-primary-container text-on-primary-container rounded-xl p-md flex flex-row items-center justify-between mb-md shadow-xl">
                <View className="flex flex-row items-center gap-sm">
                  <View className="bg-on-primary-container/20 p-2 rounded-lg">
                    <Text className="text-xl">🔑</Text>
                  </View>
                  <View>
                    <Text className="text-label-sm uppercase tracking-widest opacity-80 text-on-primary-container">Active Ride OTP</Text>
                    <Text className="font-headline text-on-primary-container leading-none">{activeRide.otp || '----'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleConfirmBooking}
                  className="bg-secondary-container text-on-secondary-container text-label-md px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                  <Text className="text-label-md text-on-secondary-container font-bold">Book Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom nav */}
            <View className="bg-surface-container-lowest rounded-t-lg shadow-lg flex flex-row justify-around items-center px-4 pb-4 pt-2">
              <TouchableOpacity className="flex flex-col items-center bg-secondary-container text-on-secondary-container rounded-xl px-4 py-1.5">
                <Text className="text-xl">🏠</Text>
                <Text className="text-label-sm text-label-sm">Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                className="flex flex-col items-center text-on-surface-variant px-4 py-1.5"
              >
                <Text className="text-xl">📋</Text>
                <Text className="text-label-sm text-label-sm">Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSos}
                className="flex flex-col items-center text-on-surface-variant px-4 py-1.5"
              >
                <Text className="text-xl">🛡️</Text>
                <Text className="text-label-sm text-label-sm">Safety</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile')}
                className="flex flex-col items-center text-on-surface-variant px-4 py-1.5"
              >
                <Text className="text-xl">👤</Text>
                <Text className="text-label-sm text-label-sm">Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Vehicle Selection Panel */}
      {step === 'vehicle_select' && pickup && drop && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="bg-surface-container-lowest rounded-t-xl p-lg shadow-lg">
            <VehicleSelector selectedType={selectedVehicle?.type} fareEstimates={fareEstimates} onSelect={selectVehicle} language={language} />
            <View className="flex flex-row gap-sm mt-lg">
              <TouchableOpacity onPress={() => setStep('search')} className="w-12 h-12 bg-surface-container rounded-full items-center justify-center">
                <Text className="text-xl">←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmBooking} className="flex-1 bg-primary text-on-primary rounded-full py-3 items-center shadow-lg active:scale-95 transition-transform">
                <Text className="text-label-md uppercase tracking-wider text-on-primary font-bold">Confirm Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Matching Panel */}
      {step === 'matching' && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="bg-surface-container-lowest rounded-t-xl p-2xl items-center shadow-lg">
            <Animated.View
              className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-lg"
              style={{ transform: [{ scale: pulseAnim }] }}
            >
              <Text className="text-4xl">🔍</Text>
            </Animated.View>
            <Text className="font-headline text-on-surface mb-xs">Finding your ride...</Text>
            <Text className="font-body text-on-surface-variant mb-lg text-center">
              {matchingFailures > 0 ? `${matchingFailures + 1} attempt(s)` : '3 drivers nearby'}
            </Text>
            {matchingFailures > 0 && (
              <Text className="text-label-sm text-error mb-lg">No drivers accepted yet. {matchingFailures >= 2 ? 'Try a different vehicle.' : 'Retrying...'}</Text>
            )}
            <View className="flex flex-row gap-md">
              {matchingFailures > 0 && (
                <TouchableOpacity onPress={handleRetryMatching} className="bg-surface-container border-2 border-primary text-primary rounded-full px-6 py-3">
                  <Text className="text-label-md font-bold">Retry</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleCancelMatching} className="bg-surface-container border-2 border-primary text-primary rounded-full px-6 py-3">
                <Text className="text-label-md font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      )}

      {/* Active Ride Panel */}
      {step === 'active' && activeRide?.driver && (
        <SafeAreaView className="absolute bottom-0 left-0 right-0">
          <View className="bg-surface-container-lowest rounded-t-xl p-lg shadow-lg">
            <DriverCard driver={activeRide.driver} otp={activeRide.otp} onCall={() => handleCallDriver(activeRide.driver?.phone)} onChat={() => Alert.alert('Chat', 'Coming soon')} onTrack={handleTrack} onSos={handleSos} />
            <TouchableOpacity onPress={handlePayment} className="mt-md bg-primary text-on-primary rounded-full py-3 items-center shadow-lg active:scale-95 transition-transform">
              <Text className="text-label-md uppercase tracking-wider text-on-primary font-bold">💳 Pay Now</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Sheets */}
      <BottomSheet visible={showPickupSearch} onClose={() => setShowPickupSearch(false)}>
        <LocationSearchSheet language={language} onSelectLocation={handlePickupSelect} onClose={() => setShowPickupSearch(false)} isPickup />
      </BottomSheet>
      <BottomSheet visible={showDropSearch} onClose={() => setShowDropSearch(false)}>
        <LocationSearchSheet language={language} onSelectLocation={handleDropSelect} onClose={() => setShowDropSearch(false)} />
      </BottomSheet>
      <BottomSheet visible={showMenu} onClose={() => setShowMenu(false)}>
        <View className="p-lg">
          <Text className="font-headline text-on-surface mb-lg">Menu</Text>
          {[
            { icon: '👤', label: 'Profile', route: '/(tabs)/profile' },
            { icon: '📋', label: 'History', route: '/(tabs)/history' },
            { icon: '👛', label: 'Wallet', route: '' },
            { icon: '🎫', label: 'Promotions', route: '' },
            { icon: '🆘', label: 'SOS Emergency', route: '/sos' },
            { icon: '⚙️', label: 'Settings', route: '/(tabs)/profile' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { setShowMenu(false); if (item.route) router.push(item.route as any); else Alert.alert('Coming Soon'); }}
              className="flex flex-row items-center py-md border-b border-surface-variant"
              style={{ borderBottomWidth: i < 5 ? 1 : 0 }}
            >
              <Text className="text-xl mr-lg w-8">{item.icon}</Text>
              <Text className="text-label-md text-on-surface">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
