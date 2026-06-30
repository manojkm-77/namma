import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1" style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text className="text-xl" style={{ fontSize: 20 }}>{emoji}</Text>
      <Text
        className={`text-[10px] mt-0.5 font-semibold ${focused ? 'text-[#863d3c]' : 'text-gray-400'}`}
        style={{ fontSize: 10, marginTop: 2, fontWeight: '600', color: focused ? '#863d3c' : '#9ca3af' }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <ProtectedRoute allowedRoles={['rider']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
            height: 64,
            paddingBottom: 8
          },
          tabBarShowLabel: false
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" label="Home" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📋" label="Trips" focused={focused} />
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
      </Tabs>
    </ProtectedRoute>
  );
}
