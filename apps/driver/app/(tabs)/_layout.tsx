import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1" style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text className="text-xl" style={{ fontSize: 20 }}>{emoji}</Text>
      <Text
        className={`text-[10px] mt-0.5 font-semibold ${focused ? 'text-amber-400' : 'text-gray-400'}`}
        style={{ fontSize: 10, marginTop: 2, fontWeight: '600', color: focused ? '#fbbf24' : '#9ca3af' }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <ProtectedRoute allowedRoles={['driver']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e1e1e',
            borderTopWidth: 1,
            borderTopColor: '#2a2a2a',
            height: 64,
            paddingBottom: 8
          },
          tabBarShowLabel: false
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" label="Home" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="vehicle"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🚖" label="Vehicle" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="kyc"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📄" label="KYC" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💰" label="Wallet" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="👤" label="Profile" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="telematics"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="⚡" label="Telemetry" focused={focused} />
            )
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
