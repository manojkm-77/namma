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
      <Text style={styles.headerTitle}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>
          {user?.user_metadata?.full_name ?? user?.user_metadata?.fullName ?? 'Namma Rider'}
        </Text>
        <Text style={styles.phone}>{user?.phone ?? ''}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Preferred Language: {user?.user_metadata?.preferred_language === 'kn' ? 'ಕನ್ನಡ' : 'English'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonLogout} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fee2e2',
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
    color: '#1c1c1c'
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500'
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563'
  },
  buttonLogout: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700'
  }
});
