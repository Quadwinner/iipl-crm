import { useState } from 'react'
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native'
import { formatDate, formatFileSize } from '@itoby/shared/owner'
import { downloadDocument } from '@itoby/shared/storage'
import { Button, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useDocuments } from '../../features/queries'
import { supabase } from '../../lib/supabase'
import { useStyles, type Theme } from '../../theme/theme'

/**
 * Lease documents. Opening one mints a short-lived signed URL under Storage RLS
 * and hands it to the system browser — the app never proxies the file, so the
 * bytes go straight from Supabase to the viewer.
 */
export function DocumentsScreen() {
  const styles = useStyles(makeStyles)
  const documents = useDocuments()
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  async function open(documentId: string) {
    setError(null)
    setOpeningId(documentId)
    try {
      const file = await downloadDocument(supabase(), documentId)
      await Linking.openURL(file.signedUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That document could not be opened.')
    } finally {
      setOpeningId(null)
    }
  }

  if (documents.isPending) return <Loading />
  if (documents.error) {
    return <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={documents.data ?? []}
      keyExtractor={(document) => document.id}
      refreshing={documents.isRefetching}
      onRefresh={() => void documents.refetch()}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={
        <Empty title="No documents yet" hint="Lease paperwork shared with you appears here." />
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.title}>{item.file_name}</Text>
          <Field label="Size" value={formatFileSize(item.size_bytes)} />
          {item.unit_code ? <Field label="Unit" value={item.unit_code} /> : null}
          <Field label="Added" value={formatDate(item.created_at)} />
          <View style={styles.action}>
            <Button
              label="Open"
              variant="ghost"
              busy={openingId === item.id}
              onPress={() => void open(item.id)}
            />
          </View>
        </Card>
      )}
    />
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700', marginBottom: theme.space(2) },
  action: { marginTop: theme.space(3) },
  error: { color: theme.color.danger, fontSize: 13, marginBottom: theme.space(4) },
})
