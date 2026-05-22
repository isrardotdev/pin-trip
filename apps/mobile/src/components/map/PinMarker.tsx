import { useEffect, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Pin } from '@pintrip/shared'
import { colors } from '../../constants/theme'

function PulsingRing() {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[styles.pulsingRing, { transform: [{ scale }], opacity }]} />
  )
}

interface PinMarkerProps {
  pin: Pin
  onPress: () => void
}

export function PinMarker({ pin, onPress }: PinMarkerProps) {
  if (pin.status === 'WISHLIST') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.wishlistPin}>
          <View style={styles.wishlistInner} />
        </View>
      </TouchableOpacity>
    )
  }

  if (pin.status === 'PLANNING') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.planningWrapper}>
          <PulsingRing />
          <View style={styles.planningPin} />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.visitedPin}>
        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  )
}

export function ClusterMarker({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.clusterPin}>
        <Animated.Text style={styles.clusterText}>{count}</Animated.Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wishlistPin: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bgPrimary, borderWidth: 2, borderColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accentGreen, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  wishlistInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentGreen },

  planningWrapper: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  pulsingRing: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.accentAmber,
  },
  planningPin: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: colors.accentAmber,
    shadowColor: colors.accentAmber, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },

  visitedPin: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accentGreen, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },

  clusterPin: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentGreen,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
    shadowColor: colors.accentGreen, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  clusterText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'DMSans-Medium' },
})
