import { useNavigation } from '@react-navigation/native'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import {
  getGlobalConfig,
  listFileStorageConfig,
  settingsKeys,
} from '@itoby/shared/admin'
import { Card, Empty, ErrorState, Field, Loading } from '../../../components/ui'
import { SectionHeader } from '../../../components/section'
import { supabase } from '../../../lib/supabase'
import { useStyles, useTheme, type Theme } from '../../../theme/theme'

/** Everything that does not warrant a tab of its own. */
export function AdminManageScreen() {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Rental" title="Manage" />

      <View style={styles.group}>
        <Row label="Allotments" onPress={() => navigation.navigate('AdminAllotments')} />
        <Row label="Billing" onPress={() => navigation.navigate('AdminBilling')} />
        <Row label="Expenses" onPress={() => navigation.navigate('AdminExpenses')} />
        <Row label="Maintenance staff" onPress={() => navigation.navigate('AdminStaff')} />
        <Row label="Audit log" onPress={() => navigation.navigate('AdminAudit')} />
        <Row label="Settings" onPress={() => navigation.navigate('AdminSettings')} />
      </View>

      <Text style={styles.note}>
        Creating buildings, units and allotments, and running a billing cycle, are done in the web
        portal — they are multi-step forms that a wide screen suits better.
      </Text>
    </ScrollView>
  )
}

/**
 * System configuration, read-only here.
 *
 * Each of these is written by its own `configure_*` RPC, which pairs a permission
 * check with an audit row. Editing them from a phone would mean reproducing five
 * separate forms for values that change rarely — the web portal is the right
 * place, and showing them here still answers "what is it set to?".
 */
export function AdminSettingsScreen() {
  const styles = useStyles(makeStyles)
  const config = useQuery({
    queryKey: settingsKeys.globalConfig,
    queryFn: () => getGlobalConfig(supabase()),
  })
  const fileTypes = useQuery({
    queryKey: settingsKeys.fileStorage,
    staleTime: 5 * 60_000,
    queryFn: () => listFileStorageConfig(supabase()),
  })

  if (config.isPending) return <Loading />
  if (config.error) return <ErrorState error={config.error} onRetry={() => void config.refetch()} />

  const c = config.data
  const accepted = (fileTypes.data ?? []).filter((row) => row.file_type_accepted)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader title="Company" />
      <Card>
        <Field label="Legal name" value={c?.company_legal_name || '—'} />
        <Field label="GSTIN" value={c?.company_gstin || '—'} />
        <Field label="Email" value={c?.company_email || '—'} />
        <Field label="Phone" value={c?.company_phone || '—'} />
        <Field label="Invoice prefix" value={c?.invoice_series_prefix || '—'} />
        <Field label="GST rate" value={c ? `${c.default_gst_rate_percent}%` : '—'} />
      </Card>

      <SectionHeader title="Payments" />
      <Card>
        <Field label="Grace period" value={c ? `${c.payment_grace_period_days} days` : '—'} />
        <Field label="Bank" value={c?.bank_name || '—'} />
        <Field label="IFSC" value={c?.bank_ifsc || '—'} />
      </Card>

      <SectionHeader title="Reminders" />
      <Card>
        <Field label="Lead time" value={c ? `${c.reminder_lead_time_days} days` : '—'} />
        <Field label="Repeat every" value={c ? `${c.reminder_frequency_days} days` : '—'} />
      </Card>

      <SectionHeader title="Security" />
      <Card>
        <Field label="Lockout threshold" value={String(c?.lockout_threshold ?? '—')} />
        <Field label="Lockout for" value={c ? `${c.lockout_duration_minutes} minutes` : '—'} />
        <Field label="Session timeout" value={c ? `${c.session_timeout_minutes} minutes` : '—'} />
      </Card>

      <SectionHeader title="Accepted uploads" />
      {fileTypes.isPending ? <Loading /> : null}
      {accepted.length === 0 && !fileTypes.isPending ? (
        <Empty title="No file types accepted" />
      ) : null}
      {accepted.length > 0 ? (
        <Card>
          {accepted.map((row) => (
            <Field
              key={row.file_extension}
              label={`.${row.file_extension}`}
              value={`up to ${row.max_file_size_mb} MB`}
            />
          ))}
        </Card>
      ) : null}

      <Text style={styles.note}>
        These are changed in the web portal, where each setting has its own form and its own audit
        entry.
      </Text>
    </ScrollView>
  )
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <ChevronRight size={18} color={theme.color.muted} />
    </Pressable>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  group: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    borderBottomColor: theme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: { backgroundColor: theme.color.surfaceAlt },
  rowLabel: { color: theme.color.text, fontSize: 15 },
  note: {
    color: theme.color.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: theme.space(6),
  },
})
