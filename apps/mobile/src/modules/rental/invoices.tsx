import { useState } from 'react'
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { formatCurrency, formatDate, generateInvoicePdf } from '@itoby/shared/owner'
import { downloadInvoice } from '@itoby/shared/storage'
import { supabase } from '../../lib/supabase'
import { Badge, Button, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useInvoices } from '../../features/queries'
import { theme } from '../../theme/theme'

export function InvoicesScreen() {
  const navigation = useNavigation<any>()
  const invoices = useInvoices()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Opens the tax invoice PDF through a short-lived signed URL, handed to the
   * system browser rather than proxied — the bytes go straight from Supabase.
   *
   * `document_ref` is null until the render finishes, so a first attempt can
   * legitimately fail. That is not an error worth showing: kick off `invoice-pdf`
   * and try once more, which is what the web portal does.
   */
  async function openPdf(invoiceId: string) {
    setError(null)
    setBusyId(invoiceId)
    try {
      let file
      try {
        file = await downloadInvoice(supabase(), invoiceId)
      } catch {
        await generateInvoicePdf(supabase(), invoiceId)
        file = await downloadInvoice(supabase(), invoiceId)
      }
      await Linking.openURL(file.signedUrl)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The invoice PDF could not be opened. Try again in a moment.',
      )
    } finally {
      setBusyId(null)
    }
  }

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
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={<Empty title="No invoices yet" hint="Bills appear here once raised." />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole={item.outstanding_amount > 0 ? 'button' : undefined}
          disabled={item.outstanding_amount <= 0}
          onPress={() => navigation.navigate('PayInvoice', { invoice: item })}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
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
          {item.outstanding_amount > 0 ? <Text style={styles.payHint}>Tap to pay</Text> : null}
          <View style={styles.download}>
            <Button
              label="Download invoice"
              variant="ghost"
              busy={busyId === item.invoice_id}
              onPress={() => void openPdf(item.invoice_id)}
            />
          </View>
        </Card>
        </Pressable>
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
  payHint: { color: theme.color.accent, fontSize: 12, marginTop: theme.space(3), fontWeight: '600' },
  download: { marginTop: theme.space(3) },
  error: { color: theme.color.danger, fontSize: 13, marginBottom: theme.space(4), lineHeight: 20 },
})
