import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useTheme } from '../../src/hooks/useTheme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        marginTop: 2,
        fontWeight: '700',
        color: focused ? colors.primary : colors.onSurfaceVariant,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <ProtectedRoute allowedRoles={['rider']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.outline,
            height: 64,
            paddingBottom: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" label="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📋" label="History" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="👤" label="Profile" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
