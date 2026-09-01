import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Button } from '../components/ui'
import { useAuth } from '../auth/auth'
import { theme } from '../theme/theme'

export function SignInScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setError(null)
    setBusy(true)
    const result = await signIn(email.trim(), password)
    setBusy(false)
    // The failure message is generic by design — it must not reveal whether the
    // email exists. Show it as the server worded it.
    if (!result.ok) setError(result.message ?? 'Sign-in failed.')
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.wordmark}>Itoby</Text>
          <Text style={styles.tagline}>Office rental — owner access</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@company.com"
            placeholderTextColor={theme.color.muted}
            inputMode="email"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor={theme.color.muted}
            onSubmitEditing={() => void submit()}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Sign in" busy={busy} onPress={() => void submit()} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.color.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: theme.space(6) },
  brand: { marginBottom: theme.space(10) },
  wordmark: { color: theme.color.text, fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: theme.color.muted, fontSize: 14, marginTop: theme.space(1) },
  form: { gap: theme.space(2) },
  label: { color: theme.color.muted, fontSize: 13, marginTop: theme.space(2) },
  input: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.color.text,
    fontSize: 16,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  error: { color: theme.color.danger, fontSize: 13, marginTop: theme.space(2) },
  actions: { marginTop: theme.space(5) },
})
