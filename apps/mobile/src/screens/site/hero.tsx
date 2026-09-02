import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import {
  HERO_EYEBROW,
  HERO_ROTATING,
  type AppModule,
  type SiteStat,
} from '@itoby/shared/site'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

const { width: SCREEN } = Dimensions.get('window')

/** Display type, sized to the screen but capped at the design's 42px. */
const TITLE = Math.min(42, SCREEN * 0.107)
const TITLE_LINE = Math.round(TITLE * 1.04)
/** The design tracks the headline at -0.04em. */
const TITLE_TRACK = -(TITLE * 0.04)

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
 * The word the headline cycles, carrying the lime underline with it. The web
 * does this with CSS keyframes; here each word fades and slides out before the
 * next arrives, so the swap reads as a transition rather than a flicker.
 *
 * The underline lives on the animated wrapper rather than on the Text: border
 * styles on a Text node render inconsistently across platforms, and a wrapper
 * also sizes itself to the word so the rule never overhangs it.
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
    <Animated.View
      style={[
        styles.rotorWrap,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <Text style={styles.rotor}>{HERO_ROTATING[index]}</Text>
    </Animated.View>
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

/**
 * The proof line under the actions, as two short phrases.
 *
 * The design puts a star rating here. We have no ratings with data behind them,
 * so the same slot carries the figures the CMS does hold. Labels are matched
 * loosely and then trimmed to one word, because the CMS owns their wording:
 * "Projects delivered" and "Happy clients" both have to read as a two-word
 * phrase at 11px. Anything the CMS renamed past recognition still shows, in its
 * own order, after the matched ones.
 */
function readProof(stats: SiteStat[]): [string, string] | null {
  if (stats.length === 0) return null

  const used = new Set<SiteStat>()
  const pick = (needle: string) => {
    const hit = stats.find((stat) => !used.has(stat) && stat.label.toLowerCase().includes(needle))
    if (hit) used.add(hit)
    return hit
  }

  const matched = [pick('project'), pick('year'), pick('client'), pick('countr')]
  const ordered = [
    ...matched.filter((stat): stat is SiteStat => stat !== undefined),
    ...stats.filter((stat) => !used.has(stat)),
  ]

  const FILLER = new Set(['happy', 'total', 'our', 'active'])
  const phrase = (stat: SiteStat) => {
    const word = stat.label.toLowerCase().split(/\s+/).find((part) => !FILLER.has(part))
    return `${stat.value}${stat.suffix} ${word ?? stat.label.toLowerCase()}`
  }

  const lead = ordered.slice(0, 2).map(phrase).join('   ·   ')
  const trail = ordered.slice(2, 4).map(phrase).join('   ·   ')
  return lead ? [lead, trail] : null
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
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const proof = readProof(stats)

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
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{HERO_EYEBROW}</Text>
          </View>
        </Enter>

        <Enter delay={90}>
          <View style={styles.title}>
            <Text style={styles.titleLine}>We build</Text>
            <Text style={styles.titleLine}>high-converting</Text>
            <View style={styles.rotorRow}>
              <Rotor />
            </View>
          </View>
        </Enter>

        {intro ? (
          <Enter delay={220}>
            {/*
              Two lines, and no "read more": the hero states the claim, the About
              screen carries the full paragraph. Eight lines of prose here pushed
              the action below the fold.
            */}
            <Text style={styles.body} numberOfLines={2}>
              {intro}
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
              <Text style={styles.ctaGhostText}>See our work</Text>
            </Pressable>
          </View>
        </Enter>

        {proof ? (
          <Enter delay={420}>
            <View style={styles.proof}>
              {/* Three brand discs, overlapping. Decoration, not people. */}
              <View style={styles.discs}>
                {[theme.color.accent, theme.color.accentDim, theme.color.cyan].map((color, index) => (
                  <View
                    key={color}
                    style={[
                      styles.disc,
                      { backgroundColor: color },
                      index > 0 && styles.discOverlap,
                    ]}
                  />
                ))}
              </View>
              <View style={styles.proofText}>
                <Text style={styles.proofLead} numberOfLines={1}>
                  {proof[0]}
                </Text>
                {proof[1] ? (
                  <Text style={styles.proofTrail} numberOfLines={1}>
                    {proof[1]}
                  </Text>
                ) : null}
              </View>
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
    heroInner: {
      paddingHorizontal: theme.space(5),
      paddingTop: theme.space(6),
      paddingBottom: theme.space(7),
    },

    pill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(2),
      backgroundColor: theme.color.surfaceAlt,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.pill,
      paddingLeft: 9,
      paddingRight: 12,
      paddingVertical: 6,
    },
    pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.accent },
    pillText: { color: theme.color.muted, fontSize: 11, fontWeight: '600' },

    title: { marginTop: theme.space(5) },
    titleLine: {
      color: theme.color.text,
      fontSize: TITLE,
      lineHeight: TITLE_LINE,
      fontWeight: '800',
      letterSpacing: TITLE_TRACK,
    },
    // Tall enough for the underline and for the word to slide clear of the row.
    rotorRow: { height: TITLE_LINE + 9, overflow: 'hidden' },
    // The rule sits on the bottom of the line box, so it clears the descenders
    // in "Apps" and "AI Agents" without moving between words.
    rotorWrap: {
      alignSelf: 'flex-start',
      borderBottomWidth: 3,
      borderBottomColor: theme.color.accent,
    },
    rotor: {
      color: theme.color.accent,
      fontSize: TITLE,
      lineHeight: TITLE_LINE,
      fontWeight: '800',
      letterSpacing: TITLE_TRACK,
    },

    body: {
      color: theme.color.muted,
      fontSize: 14,
      lineHeight: 22,
      marginTop: theme.space(4),
    },

    actions: { marginTop: theme.space(6), gap: 9 },
    cta: {
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaPrimary: { backgroundColor: theme.color.accent, height: 52 },
    ctaGhost: {
      height: 44,
      backgroundColor: theme.color.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.color.border,
    },
    ctaPrimaryText: { color: theme.color.accentText, fontSize: 15, fontWeight: '800' },
    ctaGhostText: { color: theme.color.text, fontSize: 13.5, fontWeight: '700' },
    pressed: { opacity: 0.75 },

    proof: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      marginTop: theme.space(6),
      paddingTop: theme.space(5),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
    },
    discs: { flexDirection: 'row' },
    disc: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.color.bg,
    },
    discOverlap: { marginLeft: -8 },
    proofText: { flex: 1, gap: 3 },
    proofLead: { color: theme.color.accent, fontSize: 11, fontWeight: '800' },
    proofTrail: { color: theme.color.muted, fontSize: 11, fontWeight: '500' },

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
