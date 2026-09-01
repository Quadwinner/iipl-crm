import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { HERO_EYEBROW, HERO_ROTATING, type AppModule, type SiteStat } from '@itoby/shared/site'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

const { width: SCREEN } = Dimensions.get('window')

/**
 * The website paints its hero with two large `oklch` radial glows behind the
 * type. React Native has no CSS gradients, so the same effect is drawn as SVG —
 * one lime glow behind the headline, one cyan lower and to the right, both at
 * low opacity so the type stays the brightest thing on screen.
 *
 * The size is measured rather than given as "100%": an Svg laid out with
 * absoluteFill and percentage dimensions collapses to a small box in the corner
 * instead of covering its parent.
 */
function Aura({ width, height }: { width: number; height: number }) {
  const { theme } = useTheme()
  if (width === 0 || height === 0) return null

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="lime" cx="18%" cy="12%" r="62%">
          <Stop offset="0" stopColor={theme.color.accent} stopOpacity="0.20" />
          <Stop offset="1" stopColor={theme.color.accent} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="cyan" cx="92%" cy="58%" r="55%">
          <Stop offset="0" stopColor={theme.color.cyan} stopOpacity="0.14" />
          <Stop offset="1" stopColor={theme.color.cyan} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#lime)" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#cyan)" />
    </Svg>
  )
}

/** Fades and lifts its children in, `delay` ms after mount. */
function Enter({ delay, children }: { delay: number; children: React.ReactNode }) {
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
      style={{
        opacity: progress,
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  )
}

/**
 * The word the headline cycles. The web does this with CSS keyframes; here each
 * word fades and slides out before the next arrives, so the swap reads as a
 * transition rather than a flicker.
 */
function Rotor() {
  const styles = useStyles(makeStyles)
  const [index, setIndex] = useState(0)
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIndex((n) => (n + 1) % HERO_ROTATING.length)
        Animated.timing(anim, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start()
      })
    }, 2800)
    return () => clearInterval(timer)
  }, [anim])

  return (
    <Animated.Text
      style={[
        styles.rotor,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {HERO_ROTATING[index]}
    </Animated.Text>
  )
}

/**
 * The product names, scrolling. Straight from the website's marquee, and it
 * earns its place twice: it puts the suite in front of a visitor before they
 * scroll, and it is the one thing on the screen that moves on its own.
 */
function Marquee({ modules }: { modules: AppModule[] }) {
  const styles = useStyles(makeStyles)
  const offset = useRef(new Animated.Value(0)).current
  const width = modules.length * 168

  useEffect(() => {
    if (width === 0) return
    const loop = Animated.loop(
      Animated.timing(offset, {
        toValue: -width,
        duration: modules.length * 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [offset, width, modules.length])

  if (modules.length === 0) return null

  return (
    <View style={styles.marquee} pointerEvents="none">
      <Animated.View style={[styles.marqueeTrack, { transform: [{ translateX: offset }] }]}>
        {/* Twice through, so the loop has no visible seam. */}
        {[0, 1].map((pass) =>
          modules.map((module) => (
            <View key={`${pass}-${module.key}`} style={styles.marqueeItem}>
              <View style={[styles.marqueeDot, { backgroundColor: module.accent }]} />
              <Text style={styles.marqueeText}>{module.name}</Text>
            </View>
          )),
        )}
      </Animated.View>
    </View>
  )
}

export function Hero({
  intro,
  stats,
  modules,
  onStart,
  onExplore,
}: {
  intro: string
  stats: SiteStat[]
  modules: AppModule[]
  onStart: () => void
  onExplore: () => void
}) {
  const styles = useStyles(makeStyles)
  const [expanded, setExpanded] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })

  return (
    <View
      style={styles.hero}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        )
      }}
    >
      <Aura width={size.width} height={size.height} />

      <View style={styles.heroInner}>
        <Enter delay={0}>
          <Text style={styles.eyebrow}>{HERO_EYEBROW}</Text>
        </Enter>

        <Enter delay={90}>
          <Text style={styles.title}>We build</Text>
          <Text style={styles.title}>high-converting</Text>
          <View style={styles.rotorRow}>
            <Rotor />
          </View>
        </Enter>

        {intro ? (
          <Enter delay={220}>
            {/*
              The full intro runs to eight lines on a phone and pushes everything
              below the fold. Three lines carry the claim; the rest is one tap away.
            */}
            <Text style={styles.body} numberOfLines={expanded ? undefined : 3}>
              {intro}
            </Text>
            <Text style={styles.more} onPress={() => setExpanded((v) => !v)}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </Enter>
        ) : null}

        <Enter delay={320}>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onStart}
              style={({ pressed }) => [styles.cta, styles.ctaPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.ctaPrimaryText}>Start a project</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onExplore}
              style={({ pressed }) => [styles.cta, styles.ctaGhost, pressed && styles.pressed]}
            >
              <Text style={styles.ctaGhostText}>Our work</Text>
            </Pressable>
          </View>
        </Enter>

        {stats.length > 0 ? (
          <Enter delay={420}>
            {/* A tight row, not a card: the figures support the claim above rather
                than forming a section of their own. */}
            <View style={styles.stats}>
              {stats.slice(0, 4).map((stat) => (
                <View key={stat.label} style={styles.stat}>
                  <Text style={styles.statValue}>
                    {stat.value}
                    <Text style={styles.statSuffix}>{stat.suffix}</Text>
                  </Text>
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </Enter>
        ) : null}
      </View>

      <Marquee modules={modules} />
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  hero: { overflow: 'hidden' },
  heroInner: { paddingHorizontal: theme.space(5), paddingTop: theme.space(6), paddingBottom: theme.space(7) },
  eyebrow: {
    color: theme.color.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: theme.space(4),
  },
  title: {
    color: theme.color.text,
    fontSize: Math.min(44, SCREEN * 0.115),
    lineHeight: Math.min(48, SCREEN * 0.125),
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  rotorRow: { height: Math.min(52, SCREEN * 0.135), justifyContent: 'center', overflow: 'hidden' },
  rotor: {
    color: theme.color.accent,
    fontSize: Math.min(44, SCREEN * 0.115),
    lineHeight: Math.min(48, SCREEN * 0.125),
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  body: {
    color: theme.color.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: theme.space(5),
  },
  more: {
    color: theme.color.accent,
    fontSize: 13,
    fontWeight: '700',
    marginTop: theme.space(2),
  },
  actions: { flexDirection: 'row', gap: theme.space(3), marginTop: theme.space(6) },
  cta: {
    flex: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: { backgroundColor: theme.color.accent },
  ctaGhost: { borderWidth: 1, borderColor: theme.color.border },
  ctaPrimaryText: { color: theme.color.accentText, fontSize: 15, fontWeight: '800' },
  ctaGhostText: { color: theme.color.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  stats: {
    flexDirection: 'row',
    marginTop: theme.space(8),
    gap: theme.space(4),
  },
  stat: { flex: 1 },
  statValue: { color: theme.color.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statSuffix: { color: theme.color.accent, fontSize: 15 },
  statLabel: { color: theme.color.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },
  marquee: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.color.border,
    paddingVertical: theme.space(3),
    overflow: 'hidden',
  },
  marqueeTrack: { flexDirection: 'row' },
  marqueeItem: { width: 168, flexDirection: 'row', alignItems: 'center', gap: theme.space(2) },
  marqueeDot: { width: 6, height: 6, borderRadius: 3 },
  marqueeText: {
    color: theme.color.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
