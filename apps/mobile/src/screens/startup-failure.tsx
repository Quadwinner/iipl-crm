import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useStyles, type Theme } from '../theme/theme'

/**
 * Shown when the app cannot even work out whether someone is signed in — a bad
 * Supabase URL, no network on first launch, a corrupt stored session. Expo Go's
 * own crash screen names none of those, so this one prints the real message.
 */
export function StartupFailure({ error }: { error: Error | null }) {
  const styles = useStyles(makeStyles)
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Could not start</Text>
      <Text style={styles.message}>
        {error?.message ?? 'The app could not reach Supabase or read its stored session.'}
      </Text>
      {error?.stack ? (
        <ScrollView style={styles.stackBox}>
          <Text style={styles.stack}>{error.stack}</Text>
        </ScrollView>
      ) : null}
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.bg,
    padding: theme.space(6),
    paddingTop: theme.space(16),
  },
  title: { color: theme.color.danger, fontSize: 20, fontWeight: '800', marginBottom: theme.space(3) },
  message: { color: theme.color.text, fontSize: 15, lineHeight: 22, marginBottom: theme.space(5) },
  stackBox: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.sm,
    padding: theme.space(3),
  },
  stack: { color: theme.color.muted, fontSize: 11, fontFamily: 'monospace' },
})
