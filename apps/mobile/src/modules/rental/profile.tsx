import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileKeys, updateOwnerProfile } from '@itoby/shared/owner'
import { Badge, Button, Card, ErrorState, Field, Loading } from '../../components/ui'
import { useOwnerProfile } from '../../features/queries'
import { supabase } from '../../lib/supabase'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

/**
 * The owner's own contact details. `update_owner_profile` resolves the owner
 * from auth.uid(), so no owner id is sent and one owner cannot edit another.
 */
export function ProfileScreen() {
  const styles = useStyles(makeStyles)
  const queryClient = useQueryClient()
  const profile = useOwnerProfile()
  const [form, setForm] = useState({ name: '', contact_email: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile.data) return
    setForm({
      name: profile.data.name,
      contact_email: profile.data.contact_email,
      phone: profile.data.phone,
    })
  }, [profile.data])

  const save = useMutation({
    mutationFn: () => updateOwnerProfile(supabase(), form),
    onSuccess: () => {
      setSaved(true)
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : String(cause)),
  })

  if (profile.isPending) return <Loading />
  if (profile.error) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Field label="Account" value={profile.data?.id.slice(0, 8) ?? '—'} />
        <View style={styles.badge}>
          <Badge label={profile.data?.status ?? 'UNKNOWN'} />
        </View>
      </Card>

      <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
      <Input
        label="Contact email"
        value={form.contact_email}
        onChange={(v) => setForm((f) => ({ ...f, contact_email: v }))}
        keyboardType="email-address"
      />
      <Input
        label="Phone"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        keyboardType="phone-pad"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved && !error ? <Text style={styles.saved}>Saved.</Text> : null}

      <Button
        label="Save changes"
        busy={save.isPending}
        onPress={() => {
          setError(null)
          setSaved(false)
          save.mutate()
        }}
      />
    </ScrollView>
  )
}

function Input({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  keyboardType?: 'email-address' | 'phone-pad'
}) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        placeholderTextColor={theme.color.muted}
      />
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  badge: { marginTop: theme.space(3) },
  field: { marginTop: theme.space(4) },
  label: { color: theme.color.muted, fontSize: 12, marginBottom: theme.space(2) },
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
  error: { color: theme.color.danger, fontSize: 13, marginVertical: theme.space(4), lineHeight: 20 },
  saved: { color: theme.color.ok, fontSize: 13, marginVertical: theme.space(4) },
})
