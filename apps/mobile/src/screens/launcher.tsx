import { useNavigation } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Inbox } from 'lucide-react-native'
import type { AppModule } from '@itoby/shared/site'
import { Empty, ErrorState, Loading } from '../components/ui'
import { Enter } from '../components/motion'
import { SectionHead } from '../components/section'
import { iconByName } from '../lib/icons'
import { useAuth } from '../auth/auth'
import { useMyModules } from '../features/site'
import { AppsGrid, type ExtraTile } from './site/apps-grid'
import { useStyles, useTheme, type Theme } from '../theme/theme'

/**
 * The launcher — the superapp's front door once signed in.
 *
 * Same grid as the home screen, deliberately: signing in should not change what
 * the products look like or where they sit. What it adds is the products this
 * account can actually reach, because the tiles come from
 * modules_for_current_user() and their visibility is decided by role in the
 * database. There is no client-side role filtering here to get out of step
 * with it.
 */
export function LauncherScreen() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const { email, role } = useAuth()
  const modules = useMyModules()

  if (modules.isPending) return <Loading />
  if (modules.error) return <ErrorState error={modules.error} onRetry={() => void modules.refetch()} />

  const list = modules.data ?? []
  const live = list.filter((module) => module.status === 'ACTIVE')

  function open(module: AppModule) {
    if (module.status !== 'ACTIVE') {
      navigation.navigate('ModuleComingSoon', { moduleKey: module.key })
      return
    }
    // Only rental is built. Anything else registered as ACTIVE without a screen
    // here falls back to its own detail page rather than navigating nowhere.
    if (module.key === 'rental') navigation.navigate('Rental')
    else navigation.navigate('ModuleComingSoon', { moduleKey: module.key })
  }

  // Leads is the superapp's own admin, not an app_modules row, so it is added
  // here rather than coming back from modules_for_current_user().
  const extras: ExtraTile[] =
    role === 'ADMINISTRATOR'
      ? [
          {
            key: 'leads',
            name: 'Leads',
            icon: Inbox,
            accent: theme.color.cyan,
            onPress: () => navigation.navigate('Workspace'),
          },
        ]
      : []

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Enter>
          <SectionHead title="Your apps" />
        </Enter>

        {list.length === 0 && extras.length === 0 ? (
          <Empty
            title="No products yet"
            hint="Your account has not been given access to a product. An administrator can grant it."
          />
        ) : (
          <View style={styles.card}>
            <AppsGrid modules={list} extras={extras} onOpen={open} />
          </View>
        )}
      </View>

      {live.length > 0 ? (
        <View style={styles.section}>
          <Enter delay={100}>
            <SectionHead title="Ready to open" />
          </Enter>
          {live.map((module, index) => (
            <Enter key={module.id} delay={140 + index * 60}>
              <OpenRow module={module} onPress={() => open(module)} />
            </Enter>
          ))}
        </View>
      ) : null}

      {email ? (
        <Text style={styles.signedIn} numberOfLines={1}>
          Signed in as {email}
        </Text>
      ) : null}
    </ScrollView>
  )
}

/** One live product, as a row you can open rather than a card you can read. */
function OpenRow({ module, onPress }: { module: AppModule; onPress: () => void }) {
  const styles = useStyles(makeStyles)
  const Icon = iconByName(module.icon)

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${module.accent}22` }]}>
        <Icon size={22} color={module.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowName}>{module.name}</Text>
        {module.tagline ? (
          <Text style={styles.rowTagline} numberOfLines={1}>
            {module.tagline}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowCta}>
        <Text style={styles.rowCtaText}>Open</Text>
      </View>
    </Pressable>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.color.bg },
    content: { paddingTop: theme.space(5), paddingBottom: theme.space(12) },
    section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
    pressed: { opacity: 0.75 },

    card: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingVertical: theme.space(5),
      paddingHorizontal: theme.space(2),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(3),
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      padding: theme.space(3),
      marginBottom: theme.space(3),
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowName: { color: theme.color.text, fontSize: 14.5, fontWeight: '700' },
    rowTagline: { color: theme.color.muted, fontSize: 12, marginTop: 2 },
    rowCta: {
      backgroundColor: theme.color.accent,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.space(4),
      paddingVertical: theme.space(2),
    },
    rowCtaText: { color: theme.color.accentText, fontSize: 13, fontWeight: '800' },

    signedIn: {
      color: theme.color.muted,
      fontSize: 12,
      paddingHorizontal: theme.space(5),
    },
  })
