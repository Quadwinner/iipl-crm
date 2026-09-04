import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Button, Card, Field } from '../components/ui'
import { SectionHeader } from '../components/section'
import { links } from '../lib/links'
import { useAuth } from '../auth/auth'
import { useSiteSettings } from '../features/site'
import { useStyles, useTheme, type Theme } from '../theme/theme'

/**
 * Account-level settings for the superapp, not for any one module. A module's
 * own profile screen — the owner's contact details, say — stays inside it.
 */
export function AccountScreen() {
  const styles = useStyles(makeStyles)
  const { email, role, signOut } = useAuth()
  const { preference, setPreference, scheme } = useTheme()
  const settings = useSiteSettings()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Account" title="Your account" />

      <Card>
        <Field label="Email" value={email ?? '—'} />
        <Field label="Role" value={role ?? '—'} />
      </Card>

      <View style={styles.block}>
        <SectionHeader title="Appearance" />
        <View style={styles.segment}>
          {(['light', 'dark', 'system'] as const).map((option) => {
            const active = option === preference
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(option)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {option === 'system' ? 'System' : option === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={styles.hint}>
          {preference === 'system'
            ? `Following your device, which is currently ${scheme}.`
            : `Always ${preference}, whatever the device is set to.`}
        </Text>
      </View>

      <View style={styles.block}>
        <SectionHeader title="Support" />
        <Card>
          <Field label="Email" value={settings.data?.email || '—'} />
          <Field label="Phone" value={settings.data?.phone || '—'} />
          <Field label="Hours" value={settings.data?.business_hours || '—'} />
        </Card>
      </View>

      <View style={styles.block}>
        <SectionHeader title="Legal" />
        {/* Google Play expects the privacy policy to be reachable from inside
            the app, not only from the store listing. */}
        <Card>
          <LinkRow label="Privacy policy" href={links.privacy} />
          <LinkRow label="Terms of use" href={links.terms} />
        </Card>
      </View>

      <View style={styles.block}>
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>

      <Text style={styles.version}>{settings.data?.company_name || 'Itoby Infotech'}</Text>
    </ScrollView>
  )
}

/** One row that opens a page on the company site in the device browser. */
function LinkRow({ label, href }: { label: string; href: string }) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(href)}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <Text style={styles.linkText}>{label}</Text>
      <ChevronRight size={16} color={theme.color.muted} />
    </Pressable>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  block: { marginTop: theme.space(7) },
  segment: {
    flexDirection: 'row',
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.space(3),
    borderRadius: theme.radius.sm,
  },
  segmentItemActive: { backgroundColor: theme.color.accent },
  segmentText: { color: theme.color.muted, fontSize: 14, fontWeight: '600' },
  segmentTextActive: { color: theme.color.accentText, fontWeight: '800' },
  hint: { color: theme.color.muted, fontSize: 12, lineHeight: 18, marginTop: theme.space(3) },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.space(3),
  },
  linkText: { color: theme.color.text, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  version: {
    color: theme.color.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.space(10),
  },
})
