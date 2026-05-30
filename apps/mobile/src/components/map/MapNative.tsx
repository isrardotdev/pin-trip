import { useRef, useImperativeHandle, forwardRef, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  Map, Camera, GeoJSONSource, Layer, UserLocation,
  type CameraRef, type GeoJSONSourceRef,
} from '@maplibre/maplibre-react-native'
import { Pin } from '@pintrip/shared'
import { colors } from '../../constants/theme'

export interface MapNativeRef {
  flyTo: (lng: number, lat: number, zoom?: number) => void
  fitAllPins: () => void
  fitBounds: (bounds: [number, number, number, number], options?: { padding?: number; duration?: number }) => void
}

interface Props {
  pins: Pin[]
  selectedPinId?: string | null
  onPinPress: (pinId: string) => void
  mapStyle?: string
  selectedBoundary?: GeoJSON.FeatureCollection | null
}

// India overview [lng, lat]
const DEFAULT_CENTER: [number, number] = [78.9629, 20.5937]
const DEFAULT_ZOOM = 4
const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json'

// Status → colour mapping
const STATUS_COLORS: Record<string, string> = {
  WISHLIST: colors.bgPrimary,   // warm white/parchment
  PLANNING: colors.accentAmber,
  VISITED:  colors.accentGreen,
}
const STATUS_STROKE: Record<string, string> = {
  WISHLIST: colors.accentGreen,
  PLANNING: '#FFFFFF',
  VISITED:  '#FFFFFF',
}

// ─── Map component ────────────────────────────────────────────────────────────

const MapNative = forwardRef<MapNativeRef, Props>(({ pins, selectedPinId, onPinPress, mapStyle, selectedBoundary }, ref) => {
  const cameraRef = useRef<CameraRef>(null)
  const sourceRef = useRef<GeoJSONSourceRef>(null)

  // Convert pins to GeoJSON FeatureCollection
  const geojson = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: pins.map(pin => ({
      type: 'Feature',
      id: pin.id,
      geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
      properties: {
        id: pin.id,
        name: pin.name,
        status: pin.status,
        selected: pin.id === selectedPinId,
        locationType: pin.locationType ?? 'POINT',
        pinColor:    STATUS_COLORS[pin.status] ?? colors.accentGreen,
        strokeColor: STATUS_STROKE[pin.status] ?? '#FFFFFF',
      },
    })),
  }), [pins, selectedPinId])

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom = 12) => {
      cameraRef.current?.flyTo({ center: [lng, lat], zoom, duration: 800 })
    },
    fitBounds: (bounds, options = {}) => {
      const p = options.padding ?? 60
      cameraRef.current?.fitBounds(bounds, { padding: { top: p, bottom: p, left: p, right: p }, duration: options.duration ?? 800 })
    },
    fitAllPins: () => {
      if (pins.length === 0) return
      if (pins.length === 1) {
        cameraRef.current?.flyTo({ center: [pins[0].lng, pins[0].lat], zoom: 10, duration: 800 })
        return
      }
      const lngs = pins.map(p => p.lng)
      const lats = pins.map(p => p.lat)
      cameraRef.current?.fitBounds(
        [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
        { padding: { top: 60, bottom: 60, left: 60, right: 60 }, duration: 800 },
      )
    },
  }))

  const initialCenter = pins.length > 0
    ? [pins[0].lng, pins[0].lat] as [number, number]
    : DEFAULT_CENTER
  const initialZoom = pins.length === 1 ? 10 : DEFAULT_ZOOM

  const handleSourcePress = async (e: any) => {
    const features: GeoJSON.Feature[] = e?.nativeEvent?.features ?? e?.features ?? []
    for (const f of features) {
      // Cluster tapped → zoom to expansion level
      if (f.properties?.cluster && f.properties?.cluster_id != null && sourceRef.current) {
        const zoom = await sourceRef.current.getClusterExpansionZoom(f.properties.cluster_id)
        const coords = (f.geometry as GeoJSON.Point).coordinates
        cameraRef.current?.flyTo({
          center: [coords[0], coords[1]],
          zoom: zoom + 0.5, // slight overshoot so pins visually separate
          duration: 600,
        })
        return
      }
      // Individual pin tapped
      if (f.properties?.id) {
        onPinPress(f.properties.id)
        return
      }
    }
  }

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={mapStyle ?? FALLBACK_STYLE}
      logoPosition={{ bottom: 8, left: 8 }}
      attributionPosition={{ bottom: 8, right: 8 }}
      compassEnabled={false}
      rotateEnabled={false}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: initialCenter, zoom: initialZoom }}
      />

      <UserLocation />

      <GeoJSONSource
        ref={sourceRef}
        id="pins"
        data={geojson}
        cluster
        clusterRadius={48}
        clusterMaxZoom={13}
        onPress={handleSourcePress}
      >
        {/* ── Cluster bubble (circle) ── */}
        <Layer
          id="clusters"
          type="circle"
          filter={['has', 'point_count']}
          paint={{
            'circle-color': colors.accentGreen,
            'circle-radius': [
              'step', ['get', 'point_count'],
              18,   // radius for <5
              5,  22,   // radius for 5–19
              20, 28,   // radius for 20+
            ],
            'circle-opacity': 0.92,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#FFFFFF',
          }}
        />

        {/* ── Cluster count label ── */}
        <Layer
          id="cluster-count"
          type="symbol"
          filter={['has', 'point_count']}
          layout={{
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 13,
          }}
          paint={{
            'text-color': '#FFFFFF',
          }}
        />

        {/* ── POINT pins — circle marker ── */}
        <Layer
          id="pins-circle"
          type="circle"
          filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'locationType'], 'POINT']]}
          paint={{
            'circle-color': ['get', 'pinColor'],
            'circle-radius': ['case', ['==', ['get', 'selected'], true], 13, 9],
            'circle-stroke-width': ['case', ['==', ['get', 'selected'], true], 3, 2.5],
            'circle-stroke-color': ['get', 'strokeColor'],
            'circle-opacity': 1,
            'circle-pitch-alignment': 'map',
          }}
        />

        {/* ── AREA pins — diamond marker (rotated square) ── */}
        <Layer
          id="pins-area"
          type="symbol"
          filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'locationType'], 'AREA']]}
          layout={{
            'icon-image': 'diamond',   // fallback: text-based diamond if icon unavailable
            'text-field': '◆',
            'text-size': ['case', ['==', ['get', 'selected'], true], 22, 16],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': ['get', 'pinColor'],
            'text-halo-color': ['get', 'strokeColor'],
            'text-halo-width': 1.5,
          }}
        />

        {/* ── Visited checkmark ── */}
        <Layer
          id="pins-visited-label"
          type="symbol"
          filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'status'], 'VISITED']]}
          layout={{
            'text-field': '✓',
            'text-size': 10,
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': '#FFFFFF',
          }}
        />

        {/* ── Pin name label (visible only when zoomed in ≥ 16) ── */}
        <Layer
          id="pins-name-label"
          type="symbol"
          minzoom={16}
          filter={['!', ['has', 'point_count']]}
          layout={{
            'text-field': ['get', 'name'],
            'text-anchor': 'left',
            'text-offset': [0.9, 0],
            'text-size': 12,
            'text-max-width': 10,
            'text-allow-overlap': false,
            'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Regular'],
          }}
          paint={{
            'text-color': '#1C1C1A',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5,
          }}
        />
      </GeoJSONSource>

      {/* ── Selected AREA pin boundary polygon ── */}
      {selectedBoundary && (
        <GeoJSONSource id="selected-boundary" data={selectedBoundary}>
          <Layer
            id="boundary-fill"
            type="fill"
            paint={{
              'fill-color': colors.accentGreen,
              'fill-opacity': 0.12,
            }}
          />
          <Layer
            id="boundary-line"
            type="line"
            paint={{
              'line-color': colors.accentGreen,
              'line-width': 2,
              'line-opacity': 0.7,
            }}
          />
        </GeoJSONSource>
      )}
    </Map>
  )
})

MapNative.displayName = 'MapNative'
export default MapNative

const styles = StyleSheet.create({})
