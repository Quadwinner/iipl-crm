import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../components/ui'
import { useAuth } from '../auth/auth'
import { useStyles, type Theme } from '../theme/theme'

/**
 * Staff and admin accounts authenticate fine but have no owner record, so every
 * owner-scoped query would come back empty. Saying so is more useful than showing
 * a set of blank screens.
 */
export function NoAccessScreen() {
  const styles = useStyles(makeStyles)
  const { role, signOut } = useAuth()

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>This app is for office owners</Text>
      <Text style={styles.body}>
        Your account is signed in as {role ?? 'an unknown role'}. Admin and staff work happens in
        the web portal.
      </Text>
      <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.bg,
    justifyContent: 'center',
    padding: theme.space(8),
    gap: theme.space(4),
  },
  title: { color: theme.color.text, fontSize: 22, fontWeight: '800' },
  body: { color: theme.color.muted, fontSize: 14, lineHeight: 21 },
})
