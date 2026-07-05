import { Stack } from 'expo-router';

export default function SosLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="panic"
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal'
        }}
      />
    </Stack>
  );
}
