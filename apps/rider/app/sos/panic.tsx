import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Vibration, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import * as Location from 'expo-location';
import { sendEmergencyAlert, EMERGENCY_NUMBERS } from '../../src/services/sos-service';

function usePanicTimer(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const [isActive, setIsActive] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isActive) return;
    if (remaining <= 0) { setIsActive(false); onExpireRef.current(); return; }
    const interval = setInterval(() => setRemaining((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [isActive, remaining]);

  const start = useCallback(() => { setRemaining(seconds); setIsActive(true); }, [seconds]);
  const reset = useCallback(() => { setRemaining(seconds); setIsActive(false); }, [seconds]);
  return { remaining, isActive, start, reset };
}

export default function PanicScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [hasDispatched, setHasDispatched] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const acquireLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError('Location permission denied'); setIsLocating(false); return null; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocationCoords(coords);
      return coords;
    } catch {
      setLocationError('Could not get precise location');
      setIsLocating(false);
      return null;
    }
  }, []);

  const handleDispatch = useCallback(async () => {
    if (hasDispatched) return;
    Vibration.cancel();
    const coords = locationCoords ?? await acquireLocation();
    if (!coords) {
      Alert.alert('Error', 'Could not determine location. Please dial 112 directly.', [
        { text: 'OK', style: 'destructive' },
      ]);
      return;
    }
    const result = await sendEmergencyAlert(user?.id || '', undefined, coords);
    setHasDispatched(true);
    setShowOverlay(true);
    Vibration.vibrate([100, 30, 100, 30, 200]);
    if (!result.success) {
      Alert.alert('⚠️ Alert Sent Locally', 'Could not reach emergency servers. Please dial 112 if help does not arrive.');
    }
  }, [hasDispatched, locationCoords, user?.id, acquireLocation]);

  const { remaining, isActive, start, reset } = usePanicTimer(2, handleDispatch);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]),
      ).start();
      Animated.timing(progressAnim, { toValue: 1, duration: 2000, useNativeDriver: false }).start();
      Vibration.vibrate([0, 200, 100, 200, 100, 200], true);
    } else {
      shakeAnim.setValue(0);
      progressAnim.setValue(0);
      Vibration.cancel();
    }
  }, [isActive, shakeAnim, progressAnim]);

  useEffect(() => { acquireLocation(); return () => Vibration.cancel(); }, []);

  const callPolice = useCallback(() => Linking.openURL(`tel:${EMERGENCY_NUMBERS.police}`), []);
  const callAmbulance = useCallback(() => Linking.openURL(`tel:${EMERGENCY_NUMBERS.ambulance}`), []);

  return (
    <View className="flex-1 bg-background">
      {/* Top App Bar */}
      <View className="flex flex-row justify-between items-center px-margin-mobile h-16 w-full fixed top-0 z-50 bg-background">
        <View className="flex flex-row items-center gap-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2 active:scale-95">
            <Text className="text-2xl">←</Text>
          </TouchableOpacity>
          <Text className="font-headline text-primary">Namma Yatri</Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-surface-container items-center justify-center overflow-hidden border-2 border-primary/10">
          <Text className="text-xl">👤</Text>
        </View>
      </View>

      <View className="pt-20 pb-margin-mobile px-margin-mobile max-w-xl mx-auto">
        {/* Warning Banner */}
        <View className="bg-error rounded-lg p-lg mb-lg flex flex-row items-start gap-md shadow-lg border-2 border-error-container/20">
          <Text className="text-3xl">⚠️</Text>
          <View>
            <Text className="font-headline text-on-error mb-xs">Emergency Center</Text>
            <Text className="font-body text-on-error opacity-90 leading-snug">
              Emergency services will be alerted immediately if you hold the trigger button for 2 seconds.
            </Text>
          </View>
        </View>

        {/* SOS Trigger Section */}
        <View className="flex flex-col items-center justify-center py-lg relative mb-lg">
          {/* Progress Ring */}
          <View className="relative items-center justify-center w-64 h-64">
            <Animated.View
              className="absolute w-full h-full rounded-full border-4"
              style={{
                borderColor: isActive ? '#692727' : '#e2e2e2',
                transform: [{ scale: pulseAnim }],
              }}
            />
            {/* Inner circle */}
            <Animated.View
              className="w-48 h-48 bg-primary rounded-full flex flex-col items-center justify-center shadow-xl"
              style={{
                transform: [
                  { scale: pulseAnim },
                  { translateX: shakeAnim },
                ],
              }}
            >
              <Text className="text-6xl mb-xs">🆘</Text>
              <Text className="font-headline text-on-primary">
                {isActive ? remaining : hasDispatched ? '✓' : 'SOS'}
              </Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            onPressIn={start}
            onPressOut={() => { if (isActive && remaining > 0) { reset(); Vibration.cancel(); }}}
            activeOpacity={1}
            disabled={hasDispatched}
            className="absolute inset-0 opacity-0"
          >
            <Text>Hold trigger</Text>
          </TouchableOpacity>

          <Text className="mt-md text-label-md text-on-surface-variant font-bold uppercase tracking-widest opacity-80">
            {isActive ? 'Releasing in 2s...' : hasDispatched ? 'Alert Sent' : 'Hold to Trigger'}
          </Text>
        </View>

        {/* Location Info Card */}
        <View className="bg-surface-container-lowest rounded-lg p-lg shadow-sm border border-outline-variant mb-lg">
          <View className="flex flex-row items-center justify-between mb-sm">
            <View className="flex flex-row items-center gap-xs">
              <Text className="text-xl text-primary">📍</Text>
              <Text className="text-label-md text-on-surface-variant">Live Location</Text>
            </View>
            <View className="bg-primary/10 text-primary px-sm py-xs rounded-full flex flex-row items-center gap-xs">
              <View className="w-2 h-2 bg-primary rounded-full" />
              <Text className="text-[10px] font-bold uppercase tracking-tighter">Updating</Text>
            </View>
          </View>
          {locationCoords ? (
            <>
              <Text className="font-headline text-on-surface mb-xs tabular-nums">
                {locationCoords.latitude.toFixed(4)}° N, {locationCoords.longitude.toFixed(4)}° E
              </Text>
              <Text className="font-body text-on-surface-variant">Near your current location</Text>
            </>
          ) : isLocating ? (
            <Text className="font-body text-on-surface-variant">Acquiring location...</Text>
          ) : locationError ? (
            <Text className="font-body text-error">{locationError}</Text>
          ) : null}
        </View>

        {/* Quick Contacts */}
        <View className="flex flex-row gap-md mb-lg">
          <TouchableOpacity
            onPress={callPolice}
            className="flex-1 bg-surface-container-high hover:bg-surface-variant p-md rounded-lg flex flex-col items-center gap-xs transition-all active:scale-95"
          >
            <View className="w-12 h-12 bg-on-surface/5 rounded-full items-center justify-center">
              <Text className="text-2xl">🚔</Text>
            </View>
            <Text className="text-label-md text-on-surface">Police 100</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={callAmbulance}
            className="flex-1 bg-surface-container-high hover:bg-surface-variant p-md rounded-lg flex flex-col items-center gap-xs transition-all active:scale-95"
          >
            <View className="w-12 h-12 bg-on-surface/5 rounded-full items-center justify-center">
              <Text className="text-2xl">🚑</Text>
            </View>
            <Text className="text-label-md text-on-surface">Ambulance</Text>
          </TouchableOpacity>
        </View>

        {/* Trusted Contacts */}
        <View className="mb-2xl">
          <View className="flex flex-row items-center justify-between mb-md">
            <Text className="font-headline text-on-surface">Emergency Contacts</Text>
            <TouchableOpacity>
              <Text className="text-primary text-label-md">Manage</Text>
            </TouchableOpacity>
          </View>

          {['Ravi Kumar', 'Anjali Sharma'].map((name, i) => (
            <View
              key={i}
              className="flex flex-row items-center justify-between p-md bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm mb-sm"
            >
              <View className="flex flex-row items-center gap-md">
                <View className="w-12 h-12 rounded-full bg-secondary-container/20 items-center justify-center">
                  <Text className="text-xl">👤</Text>
                </View>
                <View>
                  <Text className="text-label-md text-on-surface">{name}</Text>
                  <Text className="text-label-sm text-on-surface-variant">+91 98XXX XXX0{i + 1}</Text>
                </View>
              </View>
              <TouchableOpacity className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center active:scale-90 transition-transform">
                <Text className="text-xl">📞</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Fixed Footer */}
      <View className="fixed bottom-0 left-0 w-full p-md text-center bg-background/80">
        <Text className="text-label-sm text-on-surface-variant">
          Namma Yatri Safety Protocol v4.0 • 24/7 Support
        </Text>
      </View>

      {/* Triggered Alert Overlay */}
      {showOverlay && (
        <View className="absolute inset-0 z-[100] bg-primary/95 flex flex-col items-center justify-center p-xl">
          <View className="text-center text-on-primary">
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mx-auto mb-lg">
              <Text className="text-6xl">✓</Text>
            </View>
            <Text className="font-headline text-on-primary mb-md">Emergency Alert Sent</Text>
            <View className="bg-white/10 p-md rounded-lg mb-2xl">
              <Text className="text-label-sm opacity-70 uppercase tracking-widest mb-xs">Incident Ticket ID</Text>
              <Text className="font-headline text-on-primary tabular-nums tracking-widest">NY-992-SOS</Text>
            </View>
            <Text className="font-body text-on-primary mb-2xl max-w-xs mx-auto">
              Authorities and your emergency contacts have been notified. Stay on the line.
            </Text>
            <TouchableOpacity
              onPress={() => { setShowOverlay(false); reset(); Vibration.cancel(); router.back(); }}
              className="w-full bg-surface-container-lowest text-primary py-lg rounded-full shadow-xl active:scale-95 transition-all"
            >
              <Text className="font-headline text-center">I Am Safe Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
