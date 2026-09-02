import type { ReactElement } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NavigationProp } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  Inbox,
  MessageSquare,
  MessageSquarePlus,
  ReceiptIndianRupee,
  type LucideIcon,
} from 'lucide-react-native'
import type { AppModule } from '@itoby/shared/site'
import type { Role } from '@itoby/shared/types'
import { formatCurrency } from '@itoby/shared/owner'
import type { RootParamList } from '../navigation/types'
import { Empty, ErrorState, Loading } from '../components/ui'
import { Enter } from '../components/motion'
import { SectionHead } from '../components/section'
import { iconByName } from '../lib/icons'
import { useAuth } from '../auth/auth'
import { useComplaints, useInvoices } from '../features/queries'
import { useMyModules } from '../features/site'
import { AppsGrid, type ExtraTile } from './site/apps-grid'
import { useStyles, useTheme, type Theme } from '../theme/theme'

type Nav = NavigationProp<RootParamList>

/**
 * What a live product offers on the launcher beyond "open it".
 *
 * A registry keyed by `app_modules.key` and by role, so the launcher itself
 * knows nothing about renting or any other product. A module with no entry
 * still gets its tile and its open action; it simply adds nothing extra, which
 * is what every product does until someone writes its screens. When Billing
 * ships, its shortcuts are added here beside Renting's and the launcher does
 * not grow a branch.
 *
 * Nothing in here is reachable unless the module came back from
 * modules_for_current_user(), so a user without access to a product never sees
 * its shortcuts even if their role would otherwise match.
 */
const QUICK_LINKS: Record<string, Partial<Record<Role, (nav: Nav) => Shortcut[]>>> = {
  rental: {
    OFFICE_OWNER: (nav) => [
      {
        key: 'invoices',
        name: 'Invoices',
        icon: FileText,
        go: () => nav.navigate('Rental', { screen: 'RentalTabs', params: { screen: 'Invoices' } }),
      },
      {
        key: 'receipts',
        name: 'Receipts',
        icon: ReceiptIndianRupee,
        go: () => nav.navigate('Rental', { screen: 'Receipts' }),
      },
      {
        key: 'documents',
        name: 'Documents',
        icon: FolderOpen,
        go: () => nav.navigate('Rental', { screen: 'Documents' }),
      },
      {
        key: 'complaint',
        name: 'Raise issue',
        icon: MessageSquarePlus,
        go: () => nav.navigate('Rental', { screen: 'NewComplaint' }),
      },
    ],
  },
}

/** Products whose outstanding work the launcher can summarise, by role. */
const STATUS_BY_MODULE: Record<string, Partial<Record<Role, () => ReactElement>>> = {
  rental: { OFFICE_OWNER: () => <RentalOwnerStatus /> },
}

/**
 * The launcher — the superapp's front door once signed in.
 *
 * Same grid as the home screen, deliberately: signing in should not change what
 * the products look like or where they sit. What it adds is the products this
 * account can actually reach, because the tiles come from
 * modules_for_current_user() and their visibility is decided by role in the
 * database. There is no client-side role filtering here to get out of step
 * with it.
 *
 * Below the grid, one block per live product — its own status and its own
 * shortcuts, both looked up by module key. The launcher stays a launcher rather
 * than becoming a front end for whichever product happens to be built.
 */
export function LauncherScreen() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const navigation = useNavigation<Nav>()
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

      {live.map((module, index) => (
        <ModuleBlock
          key={module.id}
          module={module}
          role={role}
          delay={100 + index * 80}
          onOpen={() => open(module)}
        />
      ))}

      {email ? (
        <View style={styles.footer}>
          <Text style={styles.signedIn} numberOfLines={1}>
            Signed in as {email}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

/** One live product: what it needs from you, and the ways into it. */
function ModuleBlock({
  module,
  role,
  delay,
  onOpen,
}: {
  module: AppModule
  role: Role | null
  delay: number
  onOpen: () => void
}) {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation<Nav>()
  const Icon = iconByName(module.icon)

  const Status = role ? STATUS_BY_MODULE[module.key]?.[role] : undefined
  const shortcuts = role ? (QUICK_LINKS[module.key]?.[role]?.(navigation) ?? []) : []

  return (
    <View style={styles.section}>
      <Enter delay={delay}>
        <SectionHead title={module.name} actionLabel="Open" onAction={onOpen} />
      </Enter>

      <Enter delay={delay + 40}>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={({ pressed }) => [styles.headRow, pressed && styles.pressed]}
          >
            <View style={[styles.headIcon, { backgroundColor: `${module.accent}22` }]}>
              <Icon size={20} color={module.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.headTagline} numberOfLines={2}>
                {module.tagline || module.summary}
              </Text>
            </View>
          </Pressable>

          {Status ? <Status /> : null}

          {shortcuts.length > 0 ? (
            <View style={styles.shortcuts}>
              {shortcuts.map((shortcut) => (
                <View key={shortcut.key} style={styles.shortcutCell}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={shortcut.go}
                    style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
                  >
                    <View style={styles.shortcutIcon}>
                      <shortcut.icon size={19} color={module.accent} />
                    </View>
                    <Text style={styles.shortcutText} numberOfLines={2}>
                      {shortcut.name}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Enter>
    </View>
  )
}

/**
 * What Renting is waiting on, for the owner it belongs to.
 *
 * A component rather than a value so its queries only run when it is mounted —
 * both reads are owner-scoped by RLS from the session, and firing them for a
 * role that owns nothing would be two round trips to fetch two empty lists.
 *
 * Renders nothing while loading, so the block never reflows under a thumb
 * already on its way to a tile. With nothing outstanding it says so in one
 * line rather than listing two zeroes — "nothing to pay" is worth reading;
 * "0 invoices, 0 complaints" is not.
 */
function RentalOwnerStatus() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const navigation = useNavigation<Nav>()
  const invoices = useInvoices()
  const complaints = useComplaints()

  if (invoices.isPending || complaints.isPending) return null

  const due = (invoices.data ?? []).filter((invoice) => invoice.outstanding_amount > 0)
  const owed = due.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0)
  const open = (complaints.data ?? []).filter((complaint) => complaint.status !== 'RESOLVED')

  if (due.length === 0 && open.length === 0) {
    return (
      <View style={styles.status}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIcon, { backgroundColor: `${theme.color.ok}22` }]}>
            <CheckCircle2 size={17} color={theme.color.ok} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.statusTitle}>You are all caught up</Text>
            <Text style={styles.statusDetail} numberOfLines={1}>
              Nothing to pay and no open complaints
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.status}>
      {due.length > 0 ? (
        <StatusRow
          icon={FileText}
          tone="warn"
          title={`${due.length} invoice${due.length === 1 ? '' : 's'} to pay`}
          detail={`${formatCurrency(owed)} outstanding`}
          onPress={() =>
            navigation.navigate('Rental', {
              screen: 'RentalTabs',
              params: { screen: 'Invoices' },
            })
          }
        />
      ) : null}
      {open.length > 0 ? (
        <StatusRow
          icon={MessageSquare}
          tone="info"
          title={`${open.length} complaint${open.length === 1 ? '' : 's'} open`}
          detail="Track progress and replies"
          onPress={() =>
            navigation.navigate('Rental', {
              screen: 'RentalTabs',
              params: { screen: 'Complaints' },
            })
          }
        />
      ) : null}
    </View>
  )
}

function StatusRow({
  icon: Icon,
  tone,
  title,
  detail,
  onPress,
}: {
  icon: LucideIcon
  tone: 'warn' | 'info'
  title: string
  detail: string
  onPress: () => void
}) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const color = tone === 'warn' ? theme.color.warn : theme.color.cyan

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.statusRow, pressed && styles.pressed]}
    >
      <View style={[styles.statusIcon, { backgroundColor: `${color}22` }]}>
        <Icon size={17} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <ChevronRight size={16} color={theme.color.muted} />
    </Pressable>
  )
}

/** One way into a screen inside a product that is already open to you. */
interface Shortcut {
  key: string
  name: string
  icon: LucideIcon
  go: () => void
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.color.bg },
    content: { flexGrow: 1, paddingTop: theme.space(5), paddingBottom: theme.space(6) },
    section: { marginBottom: theme.space(7), paddingHorizontal: theme.space(5) },
    pressed: { opacity: 0.7 },
    rowText: { flex: 1 },

    card: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingVertical: theme.space(4),
      paddingHorizontal: theme.space(2),
    },

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(3),
      paddingHorizontal: theme.space(2),
      paddingBottom: theme.space(3),
    },
    headIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headTagline: { color: theme.color.muted, fontSize: 12.5, lineHeight: 18 },

    status: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
      paddingTop: theme.space(1),
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(3),
      paddingVertical: theme.space(3),
      paddingHorizontal: theme.space(2),
    },
    statusIcon: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusTitle: { color: theme.color.text, fontSize: 13.5, fontWeight: '700' },
    statusDetail: { color: theme.color.muted, fontSize: 11.5, marginTop: 1 },

    shortcuts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.color.border,
      paddingTop: theme.space(4),
    },
    shortcutCell: { width: '25%' },
    shortcut: { alignItems: 'center', paddingHorizontal: 2 },
    shortcutIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.color.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.color.border,
    },
    shortcutText: {
      color: theme.color.text,
      fontSize: 11.5,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: theme.space(2),
      lineHeight: 15,
    },

    footer: {
      marginTop: 'auto',
      paddingTop: theme.space(6),
      paddingHorizontal: theme.space(5),
    },
    signedIn: { color: theme.color.muted, fontSize: 12 },
  })
