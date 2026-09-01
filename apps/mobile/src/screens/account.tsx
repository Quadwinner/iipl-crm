import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button, Card, Field } from '../components/ui'
import { SectionHeader } from '../components/section'
import { useAuth } from '../auth/auth'
import { useSiteSettings } from '../features/site'
import { theme } from '../theme/theme'

/**
 * Account-level settings for the superapp, not for any one module. A module's
 * own profile screen — the owner's contact details, say — stays inside it.
 */
export function AccountScreen() {
  const { email, role, signOut } = useAuth()
  const settings = useSiteSettings()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Account" title="Your account" />

      <Card>
        <Field label="Email" value={email ?? '—'} />
        <Field label="Role" value={role ?? '—'} />
      </Card>

      <View style={styles.block}>
        <SectionHeader title="Support" />
        <Card>
          <Field label="Email" value={settings.data?.email || '—'} />
          <Field label="Phone" value={settings.data?.phone || '—'} />
          <Field label="Hours" value={settings.data?.business_hours || '—'} />
        </Card>
      </View>

      <View style={styles.block}>
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>

      <Text style={styles.version}>{settings.data?.company_name || 'Itoby Infotech'}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  block: { marginTop: theme.space(7) },
  version: {
    color: theme.color.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.space(10),
  },
})
