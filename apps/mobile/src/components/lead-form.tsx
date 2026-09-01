import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BUDGET_RANGES, type LeadSource } from '@itoby/shared/site'
import { Button, Card } from './ui'
import { useServices, useSubmitLead } from '../features/site'
import { theme } from '../theme/theme'

/**
 * Contact and Request-a-quote share this form, as they do on the website — the
 * only difference is the `source` recorded against the lead.
 *
 * `submit_lead` is rate limited to five per email per hour and returns a message
 * written for the visitor, so failures are shown exactly as the server worded
 * them rather than replaced with something generic.
 */
export function LeadForm({ source, cta }: { source: LeadSource; cta: string }) {
  const services = useServices()
  const submit = useSubmitLead()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    service_interest: '',
    budget_range: '',
    message: '',
  })

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  async function send() {
    setError(null)
    try {
      await submit.mutateAsync({ ...form, source })
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That could not be sent.')
    }
  }

  if (sent) {
    return (
      <Card>
        <Text style={styles.doneTitle}>Thanks — that reached us.</Text>
        <Text style={styles.doneBody}>
          We read everything that comes in and reply within one business day.
        </Text>
      </Card>
    )
  }

  const valid = form.full_name.trim().length > 0 && form.email.trim().includes('@')

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Field label="Name *" value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
      <Field
        label="Email *"
        value={form.email}
        onChange={set('email')}
        placeholder="you@company.com"
        keyboardType="email-address"
      />
      <Field label="Phone" value={form.phone} onChange={set('phone')} keyboardType="phone-pad" />
      <Field label="Company" value={form.company} onChange={set('company')} />

      <Chips
        label="What do you need?"
        options={(services.data ?? []).map((service) => service.title)}
        value={form.service_interest}
        onChange={set('service_interest')}
      />
      <Chips
        label="Budget"
        options={[...BUDGET_RANGES]}
        value={form.budget_range}
        onChange={set('budget_range')}
      />

      <Field
        label="Message"
        value={form.message}
        onChange={set('message')}
        placeholder="Tell us what you're building"
        multiline
      />

      <View style={styles.action}>
        <Button
          label={cta}
          busy={submit.isPending}
          onPress={() => {
            if (valid) void send()
            else setError('Add your name and a valid email first.')
          }}
        />
      </View>
    </ScrollView>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: 'email-address' | 'phone-pad'
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.color.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  )
}

/** A dropdown is awkward on a phone; the options are few enough to tap directly. */
function Chips({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  if (options.length === 0) return null
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option === value
          return (
            <Text
              key={option}
              onPress={() => onChange(active ? '' : option)}
              style={[styles.chip, active && styles.chipActive]}
            >
              {option}
            </Text>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: theme.space(4) },
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
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
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
  action: { marginTop: theme.space(3), marginBottom: theme.space(8) },
  error: {
    color: theme.color.danger,
    fontSize: 13,
    marginBottom: theme.space(4),
    lineHeight: 20,
  },
  doneTitle: { color: theme.color.text, fontSize: 18, fontWeight: '800' },
  doneBody: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginTop: theme.space(2) },
})
