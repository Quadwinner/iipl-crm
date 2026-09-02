import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { useStyles, useTheme, type Theme } from '../theme/theme'

/** The site's section header: a small uppercase eyebrow over a display heading. */
export function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string
  title: string
  body?: string | null
}) {
  const styles = useStyles(makeStyles)
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  )
}

/**
 * The heading of one block on a screen that stacks many of them.
 *
 * Deliberately small. On a launcher-shaped screen the hierarchy comes from the
 * tiles and the container edges, not from type size — every superapp home worth
 * copying keeps its section headings near body scale and reserves display type
 * for at most one band at the very top. A display heading over each section is
 * what makes a screen read as a marketing page.
 */
export function SectionHead({
  title,
  actionLabel,
  onAction,
}: {
  title: string
  actionLabel?: string
  onAction?: () => void
}) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={styles.head}>
      <Text style={styles.headTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={10}
          style={({ pressed }) => [styles.headAction, pressed && styles.pressed]}
        >
          <Text style={styles.headActionText}>{actionLabel}</Text>
          <ChevronRight size={14} color={theme.color.accent} />
        </Pressable>
      ) : null}
    </View>
  )
}

export function Screen({ children }: { children: ReactNode }) {
  const styles = useStyles(makeStyles)
  return <View style={styles.screen}>{children}</View>
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  header: { marginBottom: theme.space(6) },
  eyebrow: {
    color: theme.color.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: theme.space(2),
  },
  title: { color: theme.color.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  body: { color: theme.color.muted, fontSize: 14, lineHeight: 22, marginTop: theme.space(3) },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space(4),
  },
  headTitle: { color: theme.color.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  headActionText: { color: theme.color.accent, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.6 },
})
