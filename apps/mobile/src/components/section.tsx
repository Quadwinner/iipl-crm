import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { theme } from '../theme/theme'

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
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  )
}

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

const styles = StyleSheet.create({
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
})
