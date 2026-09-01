import { FlatList, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate, formatTimestamp } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../../components/ui'
import {
  billingTotals,
  expenseTotals,
  useAllotments,
  useAuditPage,
  useBillingReport,
  useExpenses,
} from './queries'
import { theme } from '../../../theme/theme'

/** Every invoice raised, with the money summed at the top. */
export function AdminBillingScreen() {
  const billing = useBillingReport()

  if (billing.isPending) return <Loading />
  if (billing.error) return <ErrorState error={billing.error} onRetry={() => void billing.refetch()} />

  const totals = billingTotals(billing.data ?? [])

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={billing.data ?? []}
      keyExtractor={(row) => row.invoice_id}
      refreshing={billing.isRefetching}
      onRefresh={() => void billing.refetch()}
      ListHeaderComponent={
        <View style={styles.tiles}>
          <Tile label="Invoices" value={String(totals.invoiceCount)} />
          <Tile label="Invoiced" value={formatCurrency(totals.invoicedTotal)} />
          <Tile label="Outstanding" value={formatCurrency(totals.outstandingTotal)} tone="warn" />
          <Tile label="Overdue" value={formatCurrency(totals.overdueTotal)} tone="danger" />
        </View>
      }
      ListEmptyComponent={<Empty title="No invoices yet" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.billing_cycle_key}</Text>
            <Badge label={item.status} />
          </View>
          <Field label="Unit" value={item.unit_code} />
          <Field label="Tenant" value={item.owner_name} />
          <Field label="Total" value={formatCurrency(item.total_amount)} />
          <Field label="Due" value={formatDate(item.due_date)} />
        </Card>
      )}
    />
  )
}

export function AdminExpensesScreen() {
  const expenses = useExpenses()

  if (expenses.isPending) return <Loading />
  if (expenses.error) {
    return <ErrorState error={expenses.error} onRetry={() => void expenses.refetch()} />
  }

  const totals = expenseTotals(expenses.data ?? [])

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={expenses.data ?? []}
      keyExtractor={(row) => row.id}
      refreshing={expenses.isRefetching}
      onRefresh={() => void expenses.refetch()}
      ListHeaderComponent={
        <View style={styles.tiles}>
          <Tile label="Entries" value={String(totals.count)} />
          <Tile label="Total" value={formatCurrency(totals.total)} tone="warn" />
        </View>
      }
      ListEmptyComponent={<Empty title="No expenses recorded" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.title}</Text>
            <Badge label={item.category} />
          </View>
          <Field label="Building" value={item.building_name} />
          <Field label="Amount" value={formatCurrency(Number(item.amount))} />
          <Field label="Date" value={formatDate(item.expense_date)} />
          {item.vendor_name ? <Field label="Vendor" value={item.vendor_name} /> : null}
        </Card>
      )}
    />
  )
}

export function AdminAllotmentsScreen() {
  const allotments = useAllotments()

  if (allotments.isPending) return <Loading />
  if (allotments.error) {
    return <ErrorState error={allotments.error} onRetry={() => void allotments.refetch()} />
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={allotments.data ?? []}
      keyExtractor={(row) => row.id}
      refreshing={allotments.isRefetching}
      onRefresh={() => void allotments.refetch()}
      ListEmptyComponent={<Empty title="No allotments yet" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>
              {item.unit_code} · {item.building_name}
            </Text>
            <Badge label={item.status} />
          </View>
          <Field label="Tenant" value={item.owner_name} />
          {item.rent_amount !== null ? (
            <Field label="Rent" value={formatCurrency(item.rent_amount)} />
          ) : null}
          {item.billing_cycle ? <Field label="Cycle" value={item.billing_cycle} /> : null}
          {item.lease_start ? <Field label="From" value={formatDate(item.lease_start)} /> : null}
          {item.lease_end ? <Field label="To" value={formatDate(item.lease_end)} /> : null}
        </Card>
      )}
    />
  )
}

/**
 * The audit log's first page. It is append-only in the database — there is no
 * UPDATE or DELETE grant on audit_log_entries — so this is a record, not a list
 * to manage.
 */
export function AdminAuditScreen() {
  const audit = useAuditPage()

  if (audit.isPending) return <Loading />
  if (audit.error) return <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={audit.data?.rows ?? []}
      keyExtractor={(row) => row.id}
      refreshing={audit.isRefetching}
      onRefresh={() => void audit.refetch()}
      ListEmptyComponent={<Empty title="Nothing recorded yet" />}
      ListFooterComponent={
        audit.data?.hasMore ? (
          <Text style={styles.footer}>
            Showing the most recent 50. The full log is in the web portal.
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.title}>{item.action_type}</Text>
          <Field label="By" value={item.actor_email ?? item.actor_user_id ?? 'system'} />
          <Field label="When" value={formatTimestamp(item.created_at)} />
          {item.entity_type ? <Field label="Entity" value={item.entity_type} /> : null}
        </Card>
      )}
    />
  )
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'warn' | 'danger'
}) {
  const color =
    tone === 'warn' ? theme.color.warn : tone === 'danger' ? theme.color.danger : theme.color.accent
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space(2),
  },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3), marginBottom: theme.space(4) },
  tile: {
    width: '47.5%',
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
  },
  tileValue: { fontSize: 20, fontWeight: '800' },
  tileLabel: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(1) },
  footer: {
    color: theme.color.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.space(4),
  },
})
