import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { RootParamList } from '../../navigation/types'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatTimestamp } from '@itoby/shared/owner'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { useComplaintHistory } from '../../features/queries'
import { useStyles, type Theme } from '../../theme/theme'

/**
 * One complaint and its status history.
 *
 * The history comes from `get_complaint_history`, which returns the acting
 * user's display name alongside each event — reading `complaint_event` directly
 * could not, because owners cannot read staff `profiles` rows.
 */
export function ComplaintDetailScreen() {
  const styles = useStyles(makeStyles)
  const route = useRoute<RouteProp<RootParamList, 'ComplaintDetail'>>()
  const complaint = route.params.complaint
  const history = useComplaintHistory(complaint.id)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{complaint.category}</Text>
          <Badge label={complaint.status} />
        </View>
        <Text style={styles.description}>{complaint.description}</Text>
        <Field label="Unit" value={`${complaint.unit_code} · ${complaint.building_name}`} />
        <Field label="Raised" value={formatTimestamp(complaint.created_at)} />
        {complaint.assigned_to_name ? (
          <Field label="Assigned to" value={complaint.assigned_to_name} />
        ) : null}
      </Card>

      <Text style={styles.sectionTitle}>History</Text>
      {history.isPending ? <Loading /> : null}
      {history.error ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : null}
      {history.data?.length === 0 ? <Empty title="No status changes yet" /> : null}

      {(history.data ?? []).map((event) => (
        <View key={event.id} style={styles.event}>
          <View style={styles.dot} />
          <View style={styles.eventBody}>
            <Text style={styles.eventStatus}>{event.new_status ?? event.event_type}</Text>
            <Text style={styles.eventMeta}>
              {formatTimestamp(event.created_at)}
              {event.actor_name ? ` · ${event.actor_name}` : ''}
            </Text>
            {event.comment_text ? (
              <Text style={styles.eventNote}>{event.comment_text}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space(3),
  },
  title: { color: theme.color.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  description: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginBottom: theme.space(4) },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: theme.space(6),
    marginBottom: theme.space(4),
  },
  event: { flexDirection: 'row', gap: theme.space(3), marginBottom: theme.space(5) },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.color.accent,
    marginTop: 5,
  },
  eventBody: { flex: 1 },
  eventStatus: { color: theme.color.text, fontSize: 14, fontWeight: '700' },
  eventMeta: { color: theme.color.muted, fontSize: 12, marginTop: 2 },
  eventNote: { color: theme.color.muted, fontSize: 13, lineHeight: 20, marginTop: theme.space(2) },
})
