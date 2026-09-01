import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Easing, type LayoutChangeEvent } from 'react-native'

/**
 * Fades and lifts its children in, `delay` ms after mount.
 *
 * Kept deliberately simple: one transform and one opacity, both on the native
 * driver, so a list of these staggering in costs nothing on the JS thread.
 */
export function Enter({
  delay = 0,
  distance = 18,
  onLayout,
  children,
}: {
  delay?: number
  distance?: number
  /** Fires on the animated wrapper, which is the child the parent lays out. */
  onLayout?: (event: LayoutChangeEvent) => void
  children: ReactNode
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [delay, progress])

  return (
    <Animated.View
      onLayout={onLayout}
      style={{
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  )
}
