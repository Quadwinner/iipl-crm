import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { statusColor, theme } from '../theme/theme'

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Badge({ label }: { label: string }) {
  const color = statusColor(label)
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label.replace(/_/g, ' ')}</Text>
    </View>
  )
}

export function Button({
  label,
  onPress,
  busy,
  variant = 'primary',
}: {
  label: string
  onPress: () => void
  busy?: boolean
  variant?: 'primary' | 'ghost'
}) {
  const primary = variant === 'primary'
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        (pressed || busy) && styles.buttonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={primary ? theme.color.accentText : theme.color.text} />
      ) : (
        <Text style={[styles.buttonText, primary ? styles.buttonTextPrimary : styles.buttonTextGhost]}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

/** One labelled value in a card. */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  )
}

export function Loading() {
  return (
    <View style={styles.centre}>
      <ActivityIndicator color={theme.color.accent} />
    </View>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.centre}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  )
}

/**
 * Errors are shown with their real message. The shared data layer already turns
 * database failures into owner-readable sentences, so there is nothing to soften here.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <View style={styles.centre}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? <Button label="Try again" variant="ghost" onPress={onRetry} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    marginBottom: theme.space(3),
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: theme.space(2),
    paddingVertical: theme.space(1),
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  button: {
    borderRadius: theme.radius.sm,
    paddingVertical: theme.space(3),
    paddingHorizontal: theme.space(4),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPrimary: { backgroundColor: theme.color.accent },
  buttonGhost: { borderWidth: 1, borderColor: theme.color.border },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  buttonTextPrimary: { color: theme.color.accentText },
  buttonTextGhost: { color: theme.color.text },
  field: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.space(1) },
  fieldLabel: { color: theme.color.muted, fontSize: 13 },
  fieldValue: { color: theme.color.text, fontSize: 13, fontWeight: '600' },
  centre: { padding: theme.space(8), alignItems: 'center', gap: theme.space(3) },
  emptyTitle: { color: theme.color.text, fontSize: 15, fontWeight: '600' },
  emptyHint: { color: theme.color.muted, fontSize: 13, textAlign: 'center' },
  errorText: { color: theme.color.danger, fontSize: 14, textAlign: 'center' },
})
