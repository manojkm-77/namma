import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function TrackScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Live Tracking Map Telemetry</Text>
        <Text style={styles.mapSubtext}>Driver Manjunath is on the way...</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.row}>
          <Text style={styles.label}>ETA</Text>
          <Text style={styles.value}>4 mins</Text>
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <Text style={styles.label}>Distance Remaining</Text>
          <Text style={styles.value}>1.8 km</Text>
        </View>

        <TouchableOpacity style={styles.buttonClose} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center'
  },
  mapEmoji: {
    fontSize: 72
  },
  mapText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginTop: 12
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600'
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1c1c'
  },
  buttonClose: {
    backgroundColor: '#863d3c',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16
  }
});
