import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function KycScreen() {
  const router = useRouter();
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'unverified'>('verified');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startKycOcr = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setKycStatus('verified');
      Alert.alert('KYC Success', 'Your Aadhar & Driving License parsed successfully via AI OCR.');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Verification Status</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>KYC Verification</Text>
        <Text style={styles.statusDescription}>
          To receive ride matches and go online on Namma Ride, you must submit government-mandated documents.
        </Text>

        <View style={[styles.statusBanner, { backgroundColor: kycStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
          <Text style={[styles.statusText, { color: kycStatus === 'verified' ? '#10b981' : '#ef4444' }]}>
            {kycStatus === 'verified' ? '✅ VERIFIED & ACTIVE' : '❌ UNVERIFIED / PENDING'}
          </Text>
        </View>

        {kycStatus !== 'verified' && (
          <TouchableOpacity style={styles.buttonVerify} onPress={startKycOcr} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#111111" />
            ) : (
              <Text style={styles.verifyBtnText}>Submit KYC Documents (OCR)</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 24,
    borderRadius: 20
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  statusDescription: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24
  },
  statusBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  statusText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1
  },
  buttonVerify: {
    backgroundColor: '#fbbf24',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verifyBtnText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 15
  }
});
