import { Stack } from 'expo-router'
import { useAuthStore } from '../../src/stores/authStore'
import { Redirect } from 'expo-router'

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user)

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
