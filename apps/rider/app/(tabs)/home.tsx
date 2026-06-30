import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'kn' | 'en'>('en');
  const [step, setStep] = useState<'search' | 'matching' | 'active'>('search');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [otp, setOtp] = useState('4210');

  const startBooking = () => {
    if (!pickup || !drop) {
      Alert.alert(
        lang === 'en' ? 'Missing Details' : 'ಮಾಹಿತಿ ಕೊರತೆ',
        lang === 'en' ? 'Please fill pickup and drop addresses.' : 'ದಯವಿಟ್ಟು ಪಿಕಪ್ ಮತ್ತು ಡ್ರಾಪ್ ವಿಳಾಸಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.'
      );
      return;
    }
    setStep('matching');
    // Simulate finding a driver
    setTimeout(() => {
      setStep('active');
    }, 4000);
  };

  const handleSos = () => {
    router.push('/sos');
  };

  const handlePayment = () => {
    router.push('/payment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header and language selector */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Namma Ride</Text>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLang(lang === 'en' ? 'kn' : 'en')}
          >
            <Text style={styles.langButtonText}>
              {lang === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {step === 'search' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {lang === 'en' ? 'Where are you going?' : 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={lang === 'en' ? 'Enter Pickup Landmark (e.g. Railway Station)' : 'ಪಿಕಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ'}
              placeholderTextColor="#9ca3af"
              value={pickup}
              onChangeText={setPickup}
            />

            <TextInput
              style={styles.input}
              placeholder={lang === 'en' ? 'Enter Destination Landmark (e.g. Palace)' : 'ಡ್ರಾಪ್ ಸ್ಥಳ ನಮೂದಿಸಿ'}
              placeholderTextColor="#9ca3af"
              value={drop}
              onChangeText={setDrop}
            />

            <TouchableOpacity style={styles.buttonPrimary} onPress={startBooking}>
              <Text style={styles.buttonText}>
                {lang === 'en' ? 'Book Namma Ride' : 'ಬುಕ್ ಮಾಡಿ'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'matching' && (
          <View style={[styles.card, styles.centerAlign]}>
            <View style={styles.radarOuter}>
              <View style={styles.radarInner}></View>
            </View>
            <Text style={styles.matchingText}>
              {lang === 'en' ? 'Searching Nearby Cabs/Autos...' : 'ಹತ್ತಿರದ ವಾಹನಗಳಿಗಾಗಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ...'}
            </Text>
            <Text style={styles.subtext}>
              {lang === 'en' ? 'Connecting direct pricing options' : 'ನೇರ ದರ ಹೊಂದಾಣಿಕೆ ಮಾಡಲಾಗುತ್ತಿದೆ'}
            </Text>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => setStep('search')}
            >
              <Text style={styles.buttonSecondaryText}>
                {lang === 'en' ? 'Cancel Request' : 'ರದ್ದುಗೊಳಿಸಿ'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'active' && (
          <View style={styles.card}>
            <View style={styles.driverInfoBanner}>
              <Text style={styles.driverLabel}>
                {lang === 'en' ? 'Driver Match Found' : 'ಚಾಲಕರು ಹೊಂದಾಣಿಕೆಯಾಗಿದ್ದಾರೆ'}
              </Text>
              <Text style={styles.driverName}>Manjunath (Auto #889)</Text>
            </View>

            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>
                {lang === 'en' ? 'SHARE OTP WITH DRIVER' : 'ಚಾಲಕರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳಬೇಕಾದ OTP'}
              </Text>
              <Text style={styles.otpCode}>{otp}</Text>
            </View>

            <View style={styles.locationDetails}>
              <Text style={styles.routeText}><strong>From:</strong> {pickup}</Text>
              <Text style={styles.routeText}><strong>To:</strong> {drop}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonCall} onPress={() => Alert.alert('Masked Call', 'Connecting call masking virtual channel...')}>
                <Text style={styles.callText}>📞 {lang === 'en' ? 'Call Driver' : 'ಕರೆ ಮಾಡಿ'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonTrack} onPress={() => router.push('/track')}>
                <Text style={styles.trackText}>📍 {lang === 'en' ? 'Track' : 'ಟ್ರ್ಯಾಕ್'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSos} onPress={handleSos}>
                <Text style={styles.sosText}>🚨 SOS</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.buttonPrimary, { marginTop: 20 }]} onPress={handlePayment}>
              <Text style={styles.buttonText}>Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#863d3c',
  },
  langButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  buttonPrimary: {
    backgroundColor: '#863d3c',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerAlign: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  radarOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  radarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#863d3c',
  },
  matchingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#4b5563',
    fontWeight: 'bold',
  },
  driverInfoBanner: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
    marginBottom: 20,
  },
  driverLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  otpSection: {
    backgroundColor: '#fee2e2',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#863d3c',
    marginBottom: 8,
  },
  otpCode: {
    fontSize: 36,
    fontWeight: '900',
    color: '#863d3c',
    letterSpacing: 6,
  },
  locationDetails: {
    marginBottom: 24,
  },
  routeText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonCall: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  callText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  buttonTrack: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  trackText: {
    color: '#374151',
    fontWeight: 'bold',
  },
  buttonSos: {
    backgroundColor: '#dc2626',
    width: 80,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
