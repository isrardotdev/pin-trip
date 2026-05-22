import { useRef, useImperativeHandle, forwardRef } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps'
import { Pin, PinStatus } from '@pintrip/shared'
import { colors } from '../../constants/theme'

export interface MapNativeRef {
  flyTo: (lng: number, lat: number) => void
}

interface Props {
  pins: Pin[]
  selectedPinId?: string | null
  onPinPress: (pinId: string) => void
}

// India overview as default
const DEFAULT_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 35,
  longitudeDelta: 35,
}

const PIN_COLORS: Record<PinStatus, string> = {
  WISHLIST: colors.textTertiary,
  PLANNING: colors.accentAmber,
  VISITED: colors.accentGreen,
}

const MapNative = forwardRef<MapNativeRef, Props>(({ pins, selectedPinId, onPinPress }, ref) => {
  const mapRef = useRef<MapView>(null)

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat) => {
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }, 800)
    },
  }))

  const initialRegion = pins.length > 0
    ? {
        latitude: pins[0].lat,
        longitude: pins[0].lng,
        latitudeDelta: pins.length === 1 ? 2 : 20,
        longitudeDelta: pins.length === 1 ? 2 : 20,
      }
    : DEFAULT_REGION

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsUserLocation
      showsCompass={false}
      showsScale={false}
      rotateEnabled={false}
    >
      {pins.map((pin) => {
        const isSelected = pin.id === selectedPinId
        return (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onPress={() => onPinPress(pin.id)}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={isSelected ? 1 : 0}
          >
            <View style={[
              styles.pin,
              { backgroundColor: PIN_COLORS[pin.status] },
              isSelected && styles.pinSelected,
            ]} />
          </Marker>
        )
      })}
    </MapView>
  )
})

MapNative.displayName = 'MapNative'
export default MapNative

const styles = StyleSheet.create({
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  pinSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
})
