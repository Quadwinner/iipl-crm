import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import type { ProcessStep } from '@itoby/shared/site'
import { Enter } from '../../components/motion'
import { SectionHeader } from '../../components/section'
import { theme } from '../../theme/theme'

const NODE = 34
const RAIL_X = NODE / 2 - 1
const PULSE = 60

/**
 * How we work, as a sequence rather than four equal boxes.
 *
 * The steps are ordered and each follows the last, which the old stack of cards
 * said nowhere. A rail connects them, draws itself downward once the section is
 * on screen, and a highlight travels down it afterwards — so the eye is pulled
 * through the steps in the order they happen.
 */
export function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  /**
   * Where each node sits, so the rail can run from the first to the last and
   * stop there. Measured rather than assumed: the steps are different heights.
   *
   * A trailing arrow below the last node does not work — that step's text runs
   * on beneath it, so the arrow lands in the gutter beside the paragraph and
   * reads as the rail carrying on past the end. The direction is shown between
   * the steps instead, where it is doing real work, and the sequence simply
   * stops at the last node.
   */
  const [nodeTops, setNodeTops] = useState<number[]>([])

  const first = nodeTops[0] ?? 0
  const last = nodeTops.length === steps.length ? (nodeTops[steps.length - 1] ?? 0) : 0
  const railHeight = Math.max(0, last - first)

  // Height rather than scaleY: React Native has no transform-origin, so a scaled
  // rail would grow from its middle in both directions.
  const draw = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (railHeight === 0) return

    const drawing = Animated.timing(draw, {
      toValue: railHeight,
      duration: 900,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    const travelling = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )

    drawing.start(({ finished }) => {
      if (finished) travelling.start()
    })

    return () => {
      drawing.stop()
      travelling.stop()
    }
  }, [railHeight, draw, pulse])

  if (steps.length === 0) return null

  return (
    <View style={styles.section}>
      <Enter>
        <SectionHeader eyebrow="How we work" title="Process" />
      </Enter>

      <View style={styles.timeline}>
        {/* The rail: a dim track between the first and last nodes, the accent
            drawn over it, and a brighter segment travelling down once drawn. */}
        <View style={[styles.rail, { top: first + NODE / 2, height: railHeight }]} pointerEvents="none" />
        <Animated.View
          style={[styles.railFill, { top: first + NODE / 2, height: draw }]}
          pointerEvents="none"
        />
        {railHeight > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulse,
              { height: Math.min(PULSE, railHeight) },
              {
                top: first + NODE / 2,
                opacity: pulse.interpolate({
                  inputRange: [0, 0.12, 0.88, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: pulse.interpolate({
                      inputRange: [0, 1],
                      // Never negative: a two-step process has a rail shorter
                      // than the pulse itself.
                      outputRange: [0, Math.max(0, railHeight - PULSE)],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}

        {/* One chevron per gap, halfway between the nodes it joins. */}
        {nodeTops.length === steps.length
          ? nodeTops.slice(0, -1).map((top, index) => {
              const next = nodeTops[index + 1] ?? top
              const middle = (top + NODE + next) / 2 - 8
              return (
                <View key={`flow-${index}`} style={[styles.flow, { top: middle }]} pointerEvents="none">
                  <ChevronDown size={16} color={theme.color.accent} />
                </View>
              )
            })
          : null}

        {steps.map((step, index) => (
          <Step
            key={step.title}
            step={step}
            index={index}
            last={index === steps.length - 1}
            onNodeY={(y) =>
              setNodeTops((current) => {
                if (current[index] === y) return current
                const next = [...current]
                next[index] = y
                return next
              })
            }
          />
        ))}
      </View>
    </View>
  )
}

function Step({
  step,
  index,
  last,
  onNodeY,
}: {
  step: ProcessStep
  index: number
  last: boolean
  onNodeY?: (y: number) => void
}) {
  // Each node lights as the rail reaches it, which is what makes the drawing read
  // as progress through the steps rather than a line appearing.
  const lit = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(lit, {
      toValue: 1,
      duration: 320,
      delay: 300 + index * 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [lit, index])

  return (
    <Enter
      delay={200 + index * 120}
      distance={12}
      // The wrapper is what the timeline lays out, so its y is the node's
      // position on the rail. Measuring the inner View instead always reports 0,
      // because that View is positioned relative to this wrapper.
      onLayout={(event) => onNodeY?.(event.nativeEvent.layout.y)}
    >
      <View style={[styles.step, last && styles.stepLast]}>
        <Animated.View
          style={[
            styles.node,
            {
              borderColor: lit.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.color.border, theme.color.accent],
              }),
              backgroundColor: lit.interpolate({
                inputRange: [0, 1],
                outputRange: [theme.color.surface, theme.color.accent],
              }),
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.nodeText,
              {
                color: lit.interpolate({
                  inputRange: [0, 1],
                  outputRange: [theme.color.muted, theme.color.accentText],
                }),
              },
            ]}
          >
            {step.step}
          </Animated.Text>
        </Animated.View>

        <View style={styles.stepBody}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepText}>{step.body}</Text>
        </View>
      </View>
    </Enter>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
  timeline: { position: 'relative' },
  rail: {
    position: 'absolute',
    left: RAIL_X,
    width: 2,
    backgroundColor: theme.color.border,
  },
  railFill: {
    position: 'absolute',
    left: RAIL_X,
    width: 2,
    backgroundColor: theme.color.accent,
    opacity: 0.45,
  },
  pulse: {
    position: 'absolute',
    left: RAIL_X - 1,
    width: 4,
    borderRadius: 2,
    backgroundColor: theme.color.accent,
  },
  step: { flexDirection: 'row', gap: theme.space(4), paddingBottom: theme.space(7) },
  // The last step needs room for the arrow under its node, not a full gap.
  stepLast: { paddingBottom: theme.space(6) },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeText: { fontSize: 12, fontWeight: '800' },
  stepBody: { flex: 1, paddingTop: theme.space(1) },
  stepTitle: { color: theme.color.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  stepText: { color: theme.color.muted, fontSize: 14, lineHeight: 22, marginTop: theme.space(2) },
  flow: {
    position: 'absolute',
    left: RAIL_X - 7,
    backgroundColor: theme.color.bg,
    paddingVertical: 2,
  },
})
