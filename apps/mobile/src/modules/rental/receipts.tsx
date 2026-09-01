import { useState } from 'react'
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate, generateReceiptPdf } from '@itoby/shared/owner'
import { downloadReceipt } from '@itoby/shared/storage'
import { supabase } from '../../lib/supabase'
import { useOwnerProfile } from '../../features/queries'
import { Badge, Button, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useReceipts } from '../../features/queries'
import { theme } from '../../theme/theme'

/**
 * Payment receipts. `document_ref` is null until the PDF render finishes, which
 * is why a receipt can exist before it can be downloaded — the row is the record
 * of payment, the PDF is a rendering of it.
 */
export function ReceiptsScreen() {
  const receipts = useReceipts()
  const profile = useOwnerProfile()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * The shared helper re-checks that the receipt belongs to the requester and
   * that its payment completed, on top of the receipt and bucket RLS policies.
   * The owner id it takes is the one resolved server-side at sign-in, never a
   * value typed in here.
   */
  async function openPdf(receiptId: string) {
    const ownerId = profile.data?.id
    if (!ownerId) {
      setError('Your account is still loading. Try again in a moment.')
      return
    }
    setError(null)
    setBusyId(receiptId)
    try {
      let file
      try {
        file = await downloadReceipt(supabase(), ownerId, receiptId)
      } catch {
        // document_ref is null until the render finishes; kick it off and retry.
        await generateReceiptPdf(supabase(), receiptId)
        file = await downloadReceipt(supabase(), ownerId, receiptId)
      }
      await Linking.openURL(file.signedUrl)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The receipt could not be opened.',
      )
    } finally {
      setBusyId(null)
    }
  }

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
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
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
          <View style={styles.download}>
            <Button
              label="Download receipt"
              variant="ghost"
              busy={busyId === item.id}
              onPress={() => void openPdf(item.id)}
            />
          </View>
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
  download: { marginTop: theme.space(3) },
  error: { color: theme.color.danger, fontSize: 13, marginBottom: theme.space(4), lineHeight: 20 },
})
