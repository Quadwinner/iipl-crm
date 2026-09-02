import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { HERO_EYEBROW, HERO_ROTATING, type SiteStat } from '@itoby/shared/site'
import { Enter } from '../../components/motion'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

const { width: SCREEN } = Dimensions.get('window')

/**
 * Display type, capped well below the website's. Nothing on a launcher screen
 * should shout: every superapp home keeps its largest type around 24px and
 * spends its one band of brand at the very top, then gets out of the way.
 */
const TITLE = Math.min(25, SCREEN * 0.064)
const TITLE_LINE = Math.round(TITLE * 1.16)
const TITLE_TRACK = -(TITLE * 0.028)

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
        <RadialGradient id="lime" cx="14%" cy="10%" r="70%">
          <Stop offset="0" stopColor={theme.color.accent} stopOpacity="0.20" />
          <Stop offset="1" stopColor={theme.color.accent} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="cyan" cx="94%" cy="72%" r="60%">
          <Stop offset="0" stopColor={theme.color.cyan} stopOpacity="0.14" />
          <Stop offset="1" stopColor={theme.color.cyan} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#lime)" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#cyan)" />
    </Svg>
  )
}

/**
 * The word the headline cycles, carrying the lime rule with it.
 *
 * The rule lives on the animated wrapper rather than on the Text: border styles
 * on a Text node render inconsistently across platforms, and a wrapper also
 * sizes itself to the word. It sits on the bottom of the line box so it clears
 * the descenders in "Apps" and "AI Agents" without moving between words.
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
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      <Text style={styles.rotor}>{HERO_ROTATING[index]}</Text>
    </Animated.View>
  )
}

/**
 * The figures, as one line rather than a grid.
 *
 * Labels are trimmed to a single word because the CMS owns their wording and
 * "Projects delivered" will not fit four-across at this size. Filler words are
 * dropped so "Happy clients" reads as "clients".
 */
const FILLER = new Set(['happy', 'total', 'our', 'active'])

function trustLine(stats: SiteStat[]): string {
  return stats
    .slice(0, 4)
    .map((stat) => {
      const word = stat.label.toLowerCase().split(/\s+/).find((part) => !FILLER.has(part))
      return `${stat.value}${stat.suffix} ${word ?? stat.label.toLowerCase()}`
    })
    .join('  ·  ')
}

/**
 * The one band of brand on the home screen.
 *
 * It is not a hero: no paragraph, no buttons, no stat grid. Those belong to a
 * landing page, and every one of them pushes the app tiles below the fold. What
 * survives is who Itoby is, what it builds, and a single line of proof — then
 * the screen becomes a launcher.
 */
export function BrandBand({ stats }: { stats: SiteStat[] }) {
  const styles = useStyles(makeStyles)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const trust = trustLine(stats)

  return (
    <View
      style={styles.band}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout
        setSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        )
      }}
    >
      <Aura width={size.width} height={size.height} />

      <View style={styles.inner}>
        <Enter>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>{HERO_EYEBROW}</Text>
          </View>
        </Enter>

        <Enter delay={80}>
          <View style={styles.title}>
            <Text style={styles.titleLine}>We build high-converting</Text>
            <View style={styles.rotorRow}>
              <Rotor />
            </View>
          </View>
        </Enter>

        {trust ? (
          <Enter delay={180}>
            <Text style={styles.trust} numberOfLines={1}>
              {trust}
            </Text>
          </Enter>
        ) : null}
      </View>
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    band: { overflow: 'hidden' },
    inner: {
      paddingHorizontal: theme.space(5),
      paddingTop: theme.space(5),
      paddingBottom: theme.space(6),
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
      paddingVertical: 5,
    },
    pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.accent },
    pillText: { color: theme.color.muted, fontSize: 11, fontWeight: '600' },

    title: { marginTop: theme.space(4) },
    titleLine: {
      color: theme.color.text,
      fontSize: TITLE,
      lineHeight: TITLE_LINE,
      fontWeight: '800',
      letterSpacing: TITLE_TRACK,
    },
    rotorRow: { height: TITLE_LINE + 7, overflow: 'hidden' },
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

    trust: {
      color: theme.color.muted,
      fontSize: 11.5,
      fontWeight: '600',
      marginTop: theme.space(4),
    },
  })
