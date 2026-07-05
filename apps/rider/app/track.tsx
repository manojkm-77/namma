import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TrackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const pickupLat = Number(params.pickupLat) || 12.2958;
  const pickupLng = Number(params.pickupLng) || 76.6394;
  const dropLat = Number(params.dropLat) || 12.3058;
  const dropLng = Number(params.dropLng) || 76.6594;
  const driverPhone = (params.driverPhone as string) || '';

  const [driverPos, setDriverPos] = useState({ latitude: pickupLat - 0.008, longitude: pickupLng + 0.005 });

  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPos((prev) => ({ latitude: prev.latitude + 0.0003, longitude: prev.longitude + 0.0002 }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const routeCoords = useMemo(() => [
    { latitude: pickupLat, longitude: pickupLng },
    { latitude: (pickupLat + dropLat) / 2, longitude: (pickupLng + dropLng) / 2 },
    { latitude: dropLat, longitude: dropLng },
  ], [pickupLat, pickupLng, dropLat, dropLng]);

  const handleShare = () => Alert.alert('Share Trip', 'Trip link copied to clipboard!');
  const handleSos = () => router.push('/sos');
  const handleCall = () => {
    const phone = driverPhone || '+919876543210';
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Call failed'));
  };
  const handleChat = () => Alert.alert('Chat', 'Opening chat...');

  const region = {
    latitude: (pickupLat + dropLat) / 2,
    longitude: (pickupLng + dropLng) / 2,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Status Bar */}
      <View className="fixed top-0 left-0 w-full z-50 p-margin-mobile" style={{ paddingTop: 44 }}>
        <View className="flex flex-row items-center justify-between w-full max-w-lg mx-auto">
          <View className="flex-1 bg-primary px-4 py-3 rounded-full flex flex-row items-center shadow-lg active:scale-95 transition-transform">
            <Text className="text-xl mr-3">📍</Text>
            <Text className="text-label-md text-on-primary">En Route to Destination</Text>
          </View>
          <TouchableOpacity
            onPress={handleSos}
            className="ml-3 bg-error h-12 w-12 rounded-full items-center justify-center shadow-lg border-4 border-white/20 active:scale-90 transition-all"
          >
            <Text className="text-base font-black text-on-error">SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          showsUserLocation
          showsTraffic
          rotateEnabled
          zoomEnabled
        >
          <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Pickup" pinColor="#10B981" />
          <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Drop" pinColor="#DC2626" />
          <Marker coordinate={driverPos} title="Driver" anchor={{ x: 0.5, y: 0.5 }}>
            <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center border-2 border-primary">
              <Text className="text-2xl">🚗</Text>
            </View>
          </Marker>
          <Polyline coordinates={routeCoords} strokeColor="#692727" strokeWidth={3} lineDashPattern={[8, 4]} />
        </MapView>
      </View>

      {/* Scrollable Content Canvas */}
      <View className="absolute inset-0 z-10 overflow-y-auto pb-[220px]">
        <View className="max-w-lg mx-auto px-margin-mobile pt-24 space-y-lg">
          {/* Driver Ride Info Card */}
          <View className="bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant/30 p-lg">
            <View className="flex flex-row items-start justify-between">
              <View className="flex flex-row items-center gap-4">
                <View className="w-16 h-16 rounded-2xl bg-surface-container-high overflow-hidden border-2 border-surface-variant">
                  <Text className="text-3xl text-center pt-2">👨‍✈️</Text>
                </View>
                <View>
                  <Text className="font-headline text-primary">Vikram Singh</Text>
                  <View className="flex flex-row items-center gap-1">
                    <Text className="text-lg">⭐</Text>
                    <Text className="text-label-md text-secondary">4.92 Rating</Text>
                  </View>
                </View>
              </View>
              <View className="text-right">
                <Text className="text-label-md text-on-surface-variant">White Toyota Innova</Text>
                <View className="mt-1 bg-surface-variant px-3 py-1 rounded-lg">
                  <Text className="font-bold text-on-surface tracking-wider">KA 01 MJ 4829</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex flex-row gap-md mt-lg border-t border-surface-variant pt-lg">
              <TouchableOpacity onPress={handleCall} className="flex-1 bg-surface-container-low hover:bg-surface-variant py-3 rounded-full flex flex-row items-center justify-center">
                <Text className="text-xl mr-2">📞</Text>
                <Text className="text-label-md text-primary">Call</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleChat} className="flex-1 bg-surface-container-low hover:bg-surface-variant py-3 rounded-full flex flex-row items-center justify-center">
                <Text className="text-xl mr-2">💬</Text>
                <Text className="text-label-md text-primary">Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Telemetry & Fare Details */}
          <View className="bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant/30 overflow-hidden">
            <View className="p-lg pb-0">
              <Text className="font-headline text-on-surface mb-md">Trip Details</Text>
            </View>
            <View>
              {[
                { label: 'Booking ID', value: 'NY-2940219' },
                { label: 'Fare Structure', value: 'Standard Utility' },
                { label: 'Payment Method', value: '•••• 4829', icon: '💳' },
              ].map((row, i) => (
                <View key={i} className="flex flex-row justify-between items-center px-lg py-4 border-b border-surface-variant">
                  <Text className="text-label-md text-on-surface-variant">{row.label}</Text>
                  <View className="flex flex-row items-center gap-2">
                    {row.icon && <Text>{row.icon}</Text>}
                    <Text className="text-label-md text-on-surface font-medium">{row.value}</Text>
                  </View>
                </View>
              ))}
              <View className="px-lg py-5 bg-secondary-container/10">
                <Text className="font-headline text-primary">Total Amount</Text>
                <Text className="font-headline text-primary text-right -mt-6">₹842.00</Text>
              </View>
            </View>
          </View>

          {/* Cultural Micro-copy */}
          <View className="p-lg bg-secondary-container/10 border border-secondary-container rounded-xl flex flex-row items-center gap-4">
            <Text className="text-2xl">🌱</Text>
            <Text className="text-on-secondary-fixed-variant text-label-md leading-tight">
              Namaskara! Did you know? This ride contributes to zero-commission earnings for your driver.
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Safety Toolkit */}
      <View className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_-10px_30px_rgba(0,0,0,0.08)] px-margin-mobile pt-lg pb-8 rounded-t-xl max-w-lg mx-auto left-1/2 -translate-x-1/2 border-t border-surface-variant">
        <View className="flex flex-col gap-md">
          <TouchableOpacity
            onPress={handleShare}
            className="w-full bg-primary text-white py-4 rounded-full font-bold flex flex-row items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <Text className="text-xl">📤</Text>
            <Text className="text-label-md">Share Ride Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes, Cancel', style: 'destructive', onPress: () => router.back() }
            ])}
            className="w-full bg-white border-2 border-primary text-primary py-4 rounded-full font-bold flex flex-row items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Text className="text-xl">✕</Text>
            <Text className="text-label-md">Cancel Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
