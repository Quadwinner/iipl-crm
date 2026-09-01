import { FlatList, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useReceipts } from '../../features/queries'
import { theme } from '../../theme/theme'

/**
 * Payment receipts. `document_ref` is null until the PDF render finishes, which
 * is why a receipt can exist before it can be downloaded — the row is the record
 * of payment, the PDF is a rendering of it.
 */
export function ReceiptsScreen() {
  const receipts = useReceipts()

  if (receipts.isPending) return <Loading />
  if (receipts.error) return <ErrorState error={receipts.error} onRetry={() => void receipts.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={receipts.data ?? []}
      keyExtractor={(receipt) => receipt.id}
      refreshing={receipts.isRefetching}
      onRefresh={() => void receipts.refetch()}
      ListEmptyComponent={
        <Empty title="No receipts yet" hint="A receipt appears here once a payment completes." />
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.invoice_period}</Text>
            <Badge label={item.payment_gateway} />
          </View>
          <Field label="Unit" value={item.office_unit_code} />
          <Field label="Paid" value={formatCurrency(item.amount_paid)} />
          <Field label="On" value={formatDate(item.completed_at)} />
          {item.transaction_ref ? <Field label="Reference" value={item.transaction_ref} /> : null}
          {!item.document_ref ? <Text style={styles.pending}>PDF is still being generated.</Text> : null}
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
  pending: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(3), fontStyle: 'italic' },
})
