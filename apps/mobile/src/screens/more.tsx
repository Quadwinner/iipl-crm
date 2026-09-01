import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate, formatFileSize } from '@itoby/shared/owner'
import { Button, Card, Empty, ErrorState, Field, Loading } from '../components/ui'
import { useDocuments, useReceipts } from '../features/queries'
import { useAuth } from '../auth/auth'
import { theme } from '../theme/theme'

export function MoreScreen() {
  const { email, role, signOut } = useAuth()
  const receipts = useReceipts()
  const documents = useDocuments()

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Account</Text>
      <Card>
        <Field label="Email" value={email ?? '—'} />
        <Field label="Role" value={role ?? '—'} />
      </Card>

      <Text style={styles.heading}>Receipts</Text>
      {receipts.isPending ? <Loading /> : null}
      {receipts.error ? (
        <ErrorState error={receipts.error} onRetry={() => void receipts.refetch()} />
      ) : null}
      {receipts.data?.length === 0 ? <Empty title="No receipts yet" /> : null}
      {(receipts.data ?? []).slice(0, 10).map((receipt) => (
        <Card key={receipt.id}>
          <Text style={styles.title}>{receipt.invoice_period}</Text>
          <Field label="Unit" value={receipt.office_unit_code} />
          <Field label="Paid" value={formatCurrency(receipt.amount_paid)} />
          <Field label="On" value={formatDate(receipt.completed_at)} />
        </Card>
      ))}

      <Text style={styles.heading}>Documents</Text>
      {documents.isPending ? <Loading /> : null}
      {documents.error ? (
        <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />
      ) : null}
      {documents.data?.length === 0 ? <Empty title="No documents yet" /> : null}
      {(documents.data ?? []).map((document) => (
        <Card key={document.id}>
          <Text style={styles.title}>{document.file_name}</Text>
          <Field label="Size" value={formatFileSize(document.size_bytes)} />
          {document.unit_code ? <Field label="Unit" value={document.unit_code} /> : null}
          <Field label="Added" value={formatDate(document.created_at)} />
        </Card>
      ))}

      <View style={styles.signOut}>
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  heading: {
    color: theme.color.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: theme.space(3),
    marginTop: theme.space(4),
  },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700', marginBottom: theme.space(2) },
  signOut: { marginTop: theme.space(8) },
})
