import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();

  const handlePay = () => {
    Alert.alert(
      'Payment Initiated',
      'Select payment option: PhonePe, Razorpay, or Cash Settlement.',
      [
        { text: 'Mock Success', onPress: () => {
          Alert.alert('Payment Completed', 'Thank you for riding with Namma Ride!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
          ]);
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Amount Due</Text>
      <Text style={styles.fare}>₹120.00</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Breakdown</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Direct Driver Fare</Text>
          <Text style={styles.val}>₹120.00</Text>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={styles.label}>Platform Booking Fee</Text>
          <Text style={styles.val}>₹0.00 (Zero Fee)</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonPay} onPress={handlePay}>
        <Text style={styles.payText}>Settle & Complete Payment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  fare: {
    fontSize: 56,
    fontWeight: '900',
    color: '#863d3c',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1c',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 10,
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  val: {
    fontSize: 14,
    color: '#1c1c1c',
    fontWeight: '700'
  },
  buttonPay: {
    backgroundColor: '#863d3c',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  payText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
});
