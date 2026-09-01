import { FlatList, StyleSheet, Text } from 'react-native'
import { formatCurrency, formatDate, reminderAmount, reminderTitle } from '@itoby/shared/owner'
import { Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useReminders } from '../../features/queries'
import { theme } from '../../theme/theme'

/** In-app bill reminders, scoped to the signed-in owner by RLS. */
export function RemindersScreen() {
  const reminders = useReminders()

  if (reminders.isPending) return <Loading />
  if (reminders.error) {
    return <ErrorState error={reminders.error} onRetry={() => void reminders.refetch()} />
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={reminders.data ?? []}
      keyExtractor={(reminder) => reminder.id}
      refreshing={reminders.isRefetching}
      onRefresh={() => void reminders.refetch()}
      ListEmptyComponent={<Empty title="No reminders" hint="Rent reminders appear here." />}
      renderItem={({ item }) => {
        const amount = reminderAmount(item)
        return (
          <Card>
            <Text style={styles.title}>{reminderTitle(item)}</Text>
            {amount !== null ? <Field label="Amount" value={formatCurrency(amount)} /> : null}
            {item.payload.due_date ? (
              <Field label="Due" value={formatDate(item.payload.due_date)} />
            ) : null}
            <Field label="Sent" value={formatDate(item.created_at)} />
          </Card>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700', marginBottom: theme.space(2) },
})
