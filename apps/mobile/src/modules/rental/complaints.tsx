import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Button } from '../../components/ui'
import { formatTimestamp } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useComplaints } from '../../features/queries'
import { useStyles, type Theme } from '../../theme/theme'

export function ComplaintsScreen() {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const complaints = useComplaints()

  if (complaints.isPending) return <Loading />
  if (complaints.error) {
    return <ErrorState error={complaints.error} onRetry={() => void complaints.refetch()} />
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={complaints.data ?? []}
      keyExtractor={(complaint) => complaint.id}
      refreshing={complaints.isRefetching}
      onRefresh={() => void complaints.refetch()}
      ListHeaderComponent={
        <View style={styles.raise}>
          <Button label="Raise a complaint" onPress={() => navigation.navigate('NewComplaint')} />
        </View>
      }
      ListEmptyComponent={
        <Empty title="No complaints" hint="Raised maintenance requests appear here." />
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('ComplaintDetail', { complaint: item })}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.category}</Text>
            <Badge label={item.status} />
          </View>
          <Text style={styles.description}>{item.description}</Text>
          <Field label="Unit" value={`${item.unit_code} · ${item.building_name}`} />
          <Field label="Raised" value={formatTimestamp(item.created_at)} />
        </Card>
        </Pressable>
      )}
    />
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space(2),
  },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  description: { color: theme.color.muted, fontSize: 13, marginBottom: theme.space(3) },
  raise: { marginBottom: theme.space(4) },
})
