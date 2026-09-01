import { FlatList, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useInvoices } from '../../features/queries'
import { theme } from '../../theme/theme'

export function InvoicesScreen() {
  const invoices = useInvoices()

  if (invoices.isPending) return <Loading />
  if (invoices.error) {
    return <ErrorState error={invoices.error} onRetry={() => void invoices.refetch()} />
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={invoices.data ?? []}
      keyExtractor={(invoice) => invoice.invoice_id}
      refreshing={invoices.isRefetching}
      onRefresh={() => void invoices.refetch()}
      ListEmptyComponent={<Empty title="No invoices yet" hint="Bills appear here once raised." />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.billing_cycle_key}</Text>
            <Badge label={item.status} />
          </View>
          <Field label="Unit" value={item.unit_code} />
          <Field label="Total" value={formatCurrency(item.total_amount)} />
          <Field label="Paid" value={formatCurrency(item.paid_amount)} />
          <Field label="Due date" value={formatDate(item.due_date)} />
          {item.outstanding_amount > 0 ? (
            <View style={styles.outstanding}>
              <Text style={styles.outstandingLabel}>Outstanding</Text>
              <Text style={styles.outstandingValue}>
                {formatCurrency(item.outstanding_amount)}
              </Text>
            </View>
          ) : null}
        </Card>
      )}
    />
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
  outstanding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopColor: theme.color.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: theme.space(3),
    paddingTop: theme.space(3),
  },
  outstandingLabel: { color: theme.color.muted, fontSize: 13 },
  outstandingValue: { color: theme.color.accent, fontSize: 17, fontWeight: '800' },
})
