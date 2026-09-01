import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as DocumentPicker from 'expo-document-picker'
import {
  acceptedTypesSummary,
  attachmentCountRejection,
  attachmentRejection,
  complaintKeys,
  submitComplaint,
  type ComplaintAttachment,
} from '@itoby/shared/owner'
import { Button, Empty, Loading } from '../../components/ui'
import { useAllottedUnits, useComplaintCategories, useFileTypeRules } from '../../features/queries'
import { supabase } from '../../lib/supabase'
import { theme } from '../../theme/theme'

/**
 * Raising a maintenance request.
 *
 * `submit_complaint` re-checks that the unit is actually allotted to the caller,
 * so the unit picker is a convenience rather than the control.
 *
 * Attachments are checked here against the same rules the server enforces, so
 * the owner is told before a slow upload rather than after it. The Edge Function
 * re-validates count, size and type regardless — this is a courtesy, not the
 * gate. React Native's FormData takes a `{ uri, name, type }` object where the
 * web hands it a File; the shared layer treats both as opaque parts.
 */
export function NewComplaintScreen({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const units = useAllottedUnits()
  const categories = useComplaintCategories()

  const [unitId, setUnitId] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([])
  const fileRules = useFileTypeRules()

  async function pickAttachment() {
    setError(null)
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })
    if (picked.canceled) return

    const file = picked.assets[0]
    const candidate = { name: file.name, size: file.size ?? 0 }

    const countProblem = attachmentCountRejection(attachments.length + 1)
    if (countProblem) return setError(countProblem)

    const problem = attachmentRejection(candidate, fileRules.data ?? [])
    if (problem) return setError(problem)

    setAttachments((current) => [
      ...current,
      {
        name: file.name,
        size: file.size ?? 0,
        part: { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/octet-stream' },
      },
    ])
  }

  const submit = useMutation({
    mutationFn: () =>
      submitComplaint(supabase(), {
        office_unit_id: unitId as string,
        category: category as string,
        description: description.trim(),
        attachments,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: complaintKeys.all })
      // The complaint exists either way; a rejected file must not read as a
      // failed submission, so per-file errors are reported and the screen stays.
      if (result.attachmentErrors.length > 0) {
        setError(`Complaint raised, but: ${result.attachmentErrors.join('; ')}`)
        return
      }
      onDone()
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : String(cause)),
  })

  if (units.isPending || categories.isPending) return <Loading />
  if (units.data?.length === 0) {
    return (
      <Empty
        title="No units allotted"
        hint="A complaint has to be raised against a unit you currently hold."
      />
    )
  }

  const ready = unitId !== null && category !== null && description.trim().length >= 10

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Which unit?</Text>
      <View style={styles.chips}>
        {(units.data ?? []).map((unit) => (
          <Text
            key={unit.id}
            onPress={() => setUnitId(unit.id)}
            style={[styles.chip, unit.id === unitId && styles.chipActive]}
          >
            {unit.unit_code} · {unit.building_name}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {(categories.data ?? []).map((name) => (
          <Text
            key={name}
            onPress={() => setCategory(name)}
            style={[styles.chip, name === category && styles.chipActive]}
          >
            {name}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>What is wrong?</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Describe the problem, where it is, and since when."
        placeholderTextColor={theme.color.muted}
      />
      <Text style={styles.hint}>
        {description.trim().length < 10
          ? `${10 - description.trim().length} more characters needed`
          : ' '}
      </Text>

      <Text style={styles.label}>Attachments</Text>
      {attachments.map((file) => (
        <Text
          key={file.name}
          onPress={() => setAttachments((c) => c.filter((f) => f.name !== file.name))}
          style={styles.attachment}
        >
          {file.name}  ✕
        </Text>
      ))}
      <Button label="Add a file" variant="ghost" onPress={() => void pickAttachment()} />
      <Text style={styles.hint}>
        {fileRules.data ? acceptedTypesSummary(fileRules.data) : ' '}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Submit complaint"
        busy={submit.isPending}
        onPress={() => {
          setError(null)
          if (ready) submit.mutate()
          else setError('Pick a unit and category, and describe the problem.')
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  label: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(4), marginBottom: theme.space(2) },
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
  },
  inputMultiline: { minHeight: 130, textAlignVertical: 'top' },
  hint: { color: theme.color.muted, fontSize: 11, marginTop: theme.space(1), marginBottom: theme.space(4) },
  error: { color: theme.color.danger, fontSize: 13, marginBottom: theme.space(4), lineHeight: 20 },
  attachment: {
    color: theme.color.accent,
    fontSize: 13,
    paddingVertical: theme.space(2),
  },
})
