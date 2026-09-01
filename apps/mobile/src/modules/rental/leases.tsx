import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate, daysUntil, reminderAmount, reminderTitle } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useInvoices, useLeases, useReminders } from '../../features/queries'
import { useAuth } from '../../auth/auth'
import { theme } from '../../theme/theme'

export function LeasesScreen() {
  const { email } = useAuth()
  const leases = useLeases()
  const invoices = useInvoices()
  const reminders = useReminders()

  const refreshing = leases.isRefetching || invoices.isRefetching || reminders.isRefetching
  function refresh() {
    void leases.refetch()
    void invoices.refetch()
    void reminders.refetch()
  }

  const outstanding = (invoices.data ?? []).reduce(
    (sum, invoice) => sum + invoice.outstanding_amount,
    0,
  )
  const unpaid = (invoices.data ?? []).filter((invoice) => invoice.outstanding_amount > 0)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.color.accent} />
      }
    >
      <Text style={styles.greeting}>Signed in as</Text>
      <Text style={styles.email}>{email ?? '—'}</Text>

      <View style={styles.summary}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{formatCurrency(outstanding)}</Text>
          <Text style={styles.summaryLabel}>Outstanding</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={styles.summaryValue}>{unpaid.length}</Text>
          <Text style={styles.summaryLabel}>Bills due</Text>
        </View>
      </View>

      {reminders.data && reminders.data.length > 0 ? (
        <>
          <Text style={styles.heading}>Reminders</Text>
          {reminders.data.slice(0, 3).map((reminder) => {
            const amount = reminderAmount(reminder)
            return (
              <Card key={reminder.id}>
                <Text style={styles.cardTitle}>{reminderTitle(reminder)}</Text>
                {amount !== null ? (
                  <Field label="Amount" value={formatCurrency(amount)} />
                ) : null}
                {reminder.payload.due_date ? (
                  <Field label="Due" value={formatDate(reminder.payload.due_date)} />
                ) : null}
              </Card>
            )
          })}
        </>
      ) : null}

      <Text style={styles.heading}>Your leases</Text>
      {leases.isPending ? <Loading /> : null}
      {leases.error ? <ErrorState error={leases.error} onRetry={() => void leases.refetch()} /> : null}
      {leases.data?.length === 0 ? (
        <Empty title="No leases yet" hint="An allotment will appear here once it is assigned." />
      ) : null}
      {(leases.data ?? []).map((lease) => {
        const remaining = daysUntil(lease.lease_end)
        return (
          <Card key={lease.id}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {lease.unit_code} · {lease.building_name}
              </Text>
              <Badge label={lease.status} />
            </View>
            {lease.rent_amount !== null ? (
              <Field label="Rent" value={formatCurrency(lease.rent_amount)} />
            ) : null}
            {lease.billing_cycle ? <Field label="Cycle" value={lease.billing_cycle} /> : null}
            {lease.lease_end ? (
              <Field
                label="Ends"
                value={
                  remaining === null
                    ? formatDate(lease.lease_end)
                    : `${formatDate(lease.lease_end)} (${remaining} days)`
                }
              />
            ) : null}
          </Card>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  greeting: { color: theme.color.muted, fontSize: 13 },
  email: { color: theme.color.text, fontSize: 18, fontWeight: '700', marginBottom: theme.space(5) },
  summary: {
    flexDirection: 'row',
    backgroundColor: theme.color.surfaceAlt,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
    marginBottom: theme.space(6),
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: StyleSheet.hairlineWidth, backgroundColor: theme.color.border },
  summaryValue: { color: theme.color.accent, fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(1) },
  heading: {
    color: theme.color.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: theme.space(3),
    marginTop: theme.space(2),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space(2),
  },
  cardTitle: { color: theme.color.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
})
