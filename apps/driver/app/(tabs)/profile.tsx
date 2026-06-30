import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Driver Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>
          {user?.user_metadata?.full_name ?? user?.user_metadata?.fullName ?? 'Namma Partner'}
        </Text>
        <Text style={styles.phone}>{user?.phone ?? ''}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Preferred Language: Kannada</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonLogout} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out Partner Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 20,
    paddingTop: 50,
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    fontSize: 40
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff'
  },
  phone: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500'
  },
  badge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24'
  },
  buttonLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700'
  }
});
