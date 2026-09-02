import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowUpRight, type LucideIcon } from 'lucide-react-native'
import type { AppModule } from '@itoby/shared/site'
import { iconByName } from '../../lib/icons'
import { Enter } from '../../components/motion'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

/**
 * The suite as a launcher grid — the block a superapp opens on.
 *
 * Every product is one tap from the first screen, signed in or not, which is
 * the whole point of putting the apps above the company's own story. Tiles are
 * coloured by `app_modules.accent`, so the CMS decides what the grid looks like
 * and a new product needs no change here.
 *
 * Names carry an "IIPL " prefix that is dead weight inside the Itoby app, and
 * at this size it would push every label to two lines. It is dropped for the
 * tile only; the product's own screens still show the full name.
 */
export function shortModuleName(name: string): string {
  return name.replace(/^IIPL\s+/i, '')
}

/**
 * Four columns is the superapp norm and five is the ceiling a label can still
 * fit under. The count is chosen so a small suite lands on one row instead of
 * leaving a single tile stranded beside three empty slots, and a larger one
 * falls back to the norm.
 */
function columnsFor(count: number): number {
  return count === 5 ? 5 : 4
}

/**
 * A tile that is not an app_modules row — the superapp's own admin areas, which
 * belong in the same grid but have no CMS row behind them.
 */
export interface ExtraTile {
  key: string
  name: string
  icon: LucideIcon
  accent: string
  onPress: () => void
}

export function AppsGrid({
  modules,
  extras = [],
  columns,
  onOpen,
  onSeeAll,
}: {
  modules: AppModule[]
  extras?: ExtraTile[]
  columns?: number
  onOpen: (module: AppModule) => void
  /** Rendered as a final tile when given. */
  onSeeAll?: () => void
}) {
  const styles = useStyles(makeStyles)
  if (modules.length === 0 && extras.length === 0) return null

  const total = modules.length + extras.length + (onSeeAll ? 1 : 0)
  const width = `${100 / (columns ?? columnsFor(total))}%` as const

  return (
    <View style={styles.grid}>
      {extras.map((extra, index) => (
        <View key={extra.key} style={{ width }}>
          <Enter delay={index * 50}>
            <Pressable
              accessibilityRole="button"
              onPress={extra.onPress}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <View style={[styles.tile, { backgroundColor: `${extra.accent}22` }]}>
                <extra.icon size={22} color={extra.accent} />
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {extra.name}
              </Text>
            </Pressable>
          </Enter>
        </View>
      ))}

      {/* The width sits on the wrapper, not on the Pressable: Enter renders an
          Animated.View between them, and that is the child the grid lays out. */}
      {modules.map((module, index) => (
        <View key={module.id} style={{ width }}>
          <Enter delay={(extras.length + index) * 50}>
            <ModuleTile module={module} onPress={() => onOpen(module)} />
          </Enter>
        </View>
      ))}

      {onSeeAll ? (
        <View style={{ width }}>
          <Enter delay={total * 50}>
            <Pressable
              accessibilityRole="button"
              onPress={onSeeAll}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <SeeAllIcon />
              <Text style={styles.label} numberOfLines={2}>
                All products
              </Text>
            </Pressable>
          </Enter>
        </View>
      ) : null}
    </View>
  )
}

function SeeAllIcon() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={[styles.tile, styles.tileNeutral]}>
      <ArrowUpRight size={22} color={theme.color.muted} />
    </View>
  )
}

function ModuleTile({ module, onPress }: { module: AppModule; onPress: () => void }) {
  const styles = useStyles(makeStyles)
  const Icon = iconByName(module.icon)
  const live = module.status === 'ACTIVE'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${module.name}${live ? '' : ', coming soon'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: `${module.accent}22` }]}>
        <Icon size={22} color={module.accent} />
        {/* One dot, not a word: at tile size a status badge would outweigh the
            icon it is meant to annotate. */}
        {live ? <View style={styles.live} /> : null}
      </View>
      <Text style={[styles.label, !live && styles.labelSoon]} numberOfLines={2}>
        {shortModuleName(module.name)}
      </Text>
      {!live ? <Text style={styles.soon}>Soon</Text> : null}
    </Pressable>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.space(6) },
    cell: { alignItems: 'center', paddingHorizontal: 2 },
    pressed: { opacity: 0.6 },
    tile: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileNeutral: {
      backgroundColor: theme.color.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.color.border,
    },
    live: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.color.accent,
      borderWidth: 1.5,
      borderColor: theme.color.bg,
    },
    label: {
      color: theme.color.text,
      fontSize: 11.5,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: theme.space(2),
      lineHeight: 15,
    },
    labelSoon: { color: theme.color.muted },
    soon: {
      color: theme.color.muted,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginTop: 1,
    },
  })
