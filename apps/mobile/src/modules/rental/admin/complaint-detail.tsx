import { useState } from 'react'
import { useRoute } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { formatTimestamp } from '@itoby/shared/owner'
import type { AdminComplaintRow } from '@itoby/shared/admin'
import { COMPLAINT_UPDATABLE_STATUSES } from '@itoby/shared/validation'
import { Badge, Button, Card, Empty, ErrorState, Field, Loading } from '../../../components/ui'
import { useAuth } from '../../../auth/auth'
import {
  useAddComplaintComment,
  useAdminComplaintHistory,
  useAssignComplaint,
  useMaintenanceStaff,
  useUpdateComplaintStatus,
} from './queries'
import { theme } from '../../../theme/theme'

/**
 * Working one complaint: change its status, assign it, add a comment.
 *
 * Assignment is Administrator-only, enforced by require_permission() inside
 * `assign_complaint`. The picker is hidden for maintenance staff so they are not
 * offered an action the database will refuse — the check that matters still runs
 * server-side either way.
 */
export function AdminComplaintDetailScreen() {
  const route = useRoute<{ key: string; name: string; params: { complaint: AdminComplaintRow } }>()
  const complaint = route.params.complaint
  const { role } = useAuth()

  const history = useAdminComplaintHistory(complaint.id)
  const staff = useMaintenanceStaff()
  const setStatus = useUpdateComplaintStatus()
  const assign = useAssignComplaint()
  const comment = useAddComplaintComment()

  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  function run(work: Promise<unknown>) {
    setError(null)
    void work.catch((cause: unknown) =>
      setError(cause instanceof Error ? cause.message : String(cause)),
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{complaint.category}</Text>
          <Badge label={complaint.status} />
        </View>
        <Text style={styles.description}>{complaint.description}</Text>
        <Field label="Unit" value={`${complaint.unit_code} · ${complaint.building_name}`} />
        <Field label="Tenant" value={complaint.owner_name} />
        <Field label="Raised" value={formatTimestamp(complaint.created_at)} />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Set status</Text>
      <View style={styles.chips}>
        {COMPLAINT_UPDATABLE_STATUSES.map((status) => (
          <Text
            key={status}
            onPress={() => run(setStatus.mutateAsync({ complaintId: complaint.id, status }))}
            style={[styles.chip, status === complaint.status && styles.chipActive]}
          >
            {status.replace('_', ' ')}
          </Text>
        ))}
      </View>

      {role === 'ADMINISTRATOR' ? (
        <>
          <Text style={styles.sectionTitle}>Assign to</Text>
          {staff.isPending ? <Loading /> : null}
          <View style={styles.chips}>
            {(staff.data ?? []).map((person) => (
              <Text
                key={person.user_id}
                onPress={() =>
                  run(assign.mutateAsync({ complaintId: complaint.id, staffId: person.user_id }))
                }
                style={styles.chip}
              >
                {person.name}
              </Text>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Add a comment</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="What did you find or do?"
        placeholderTextColor={theme.color.muted}
      />
      <Button
        label="Add comment"
        busy={comment.isPending}
        onPress={() => {
          if (note.trim().length === 0) return
          run(
            comment
              .mutateAsync({ complaintId: complaint.id, comment: note.trim() })
              .then(() => setNote('')),
          )
        }}
      />

      <Text style={styles.sectionTitle}>History</Text>
      {history.isPending ? <Loading /> : null}
      {history.error ? (
        <ErrorState error={history.error} onRetry={() => void history.refetch()} />
      ) : null}
      {history.data?.length === 0 ? <Empty title="Nothing recorded yet" /> : null}
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

const styles = StyleSheet.create({
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
    marginBottom: theme.space(3),
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) },
  chip: {
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    color: theme.color.muted,
    fontSize: 13,
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2),
    overflow: 'hidden',
  },
  chipActive: {
    backgroundColor: theme.color.accent,
    borderColor: theme.color.accent,
    color: theme.color.accentText,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.color.text,
    fontSize: 15,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
    marginBottom: theme.space(3),
  },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  error: { color: theme.color.danger, fontSize: 13, marginTop: theme.space(4), lineHeight: 20 },
  event: { flexDirection: 'row', gap: theme.space(3), marginBottom: theme.space(5) },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.color.accent, marginTop: 5 },
  eventBody: { flex: 1 },
  eventStatus: { color: theme.color.text, fontSize: 14, fontWeight: '700' },
  eventMeta: { color: theme.color.muted, fontSize: 12, marginTop: 2 },
  eventNote: { color: theme.color.muted, fontSize: 13, lineHeight: 20, marginTop: theme.space(2) },
})
