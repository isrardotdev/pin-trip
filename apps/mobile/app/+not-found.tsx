import { Redirect } from 'expo-router'

// Catches unmatched deep links (e.g. pintrip://dataUrl=pintripShareKey from share intent)
// ShareIntentHandler in _layout.tsx will redirect to handle-share if hasShareIntent is true
export default function NotFound() {
  return <Redirect href="/(tabs)" />
}
