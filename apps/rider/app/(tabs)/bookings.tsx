import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const mockBookings = [
  { id: '1', date: 'June 29, 2026', time: '10:30 AM', pickup: 'Mysuru Junction Station', drop: 'Mysore Palace', fare: '₹120', status: 'Completed' },
  { id: '2', date: 'June 25, 2026', time: '04:15 PM', pickup: 'KSRTC Bus Stand Mysuru', drop: 'Chamundi Hill Temple', fare: '₹280', status: 'Completed' },
  { id: '3', date: 'June 20, 2026', time: '08:45 AM', pickup: 'Hebbal Industrial Area', drop: 'Gokulam', fare: '₹150', status: 'Completed' }
];

export default function BookingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Your Trips</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {mockBookings.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{trip.date} · {trip.time}</Text>
              <Text style={styles.fare}>{trip.fare}</Text>
            </View>
            <View style={styles.routeItem}>
              <Text style={styles.dot}>🟢</Text>
              <Text style={styles.address} numberOfLines={1}>{trip.pickup}</Text>
            </View>
            <View style={[styles.routeItem, { marginTop: 8 }]}>
              <Text style={styles.dot}>🔴</Text>
              <Text style={styles.address} numberOfLines={1}>{trip.drop}</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{trip.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1c1c1c',
    marginBottom: 20
  },
  scrollContainer: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
    marginBottom: 12
  },
  date: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600'
  },
  fare: {
    fontSize: 16,
    fontWeight: '800',
    color: '#863d3c'
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dot: {
    fontSize: 12,
    marginRight: 8
  },
  address: {
    fontSize: 14,
    color: '#1c1c1c',
    fontWeight: '500',
    flex: 1
  },
  badgeContainer: {
    alignItems: 'flex-end',
    marginTop: 12
  },
  badge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  }
});
