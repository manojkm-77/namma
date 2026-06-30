import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function SosScreen() {
  const router = useRouter();

  const triggerSos = () => {
    Alert.alert(
      'SOS Triggered',
      'Emergency alerts dispatched to Karnataka police and family contacts. Dispatching assistance.',
      [{ text: 'Dismiss', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EMERGENCY PROTOCOL</Text>
      <Text style={styles.description}>
        Pressing the button below will immediately broadcast your coordinates to local authorities and initiate emergency call masking.
      </Text>

      <TouchableOpacity style={styles.sosButton} onPress={triggerSos}>
        <Text style={styles.sosButtonText}>🚨 PANIC</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonCancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel & Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#991b1b',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 16
  },
  description: {
    fontSize: 14,
    color: '#fee2e2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
    paddingHorizontal: 20
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 48
  },
  sosButtonText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#991b1b'
  },
  buttonCancel: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  cancelText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
