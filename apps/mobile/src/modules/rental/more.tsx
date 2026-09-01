import { useNavigation } from '@react-navigation/native'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatCurrency } from '@itoby/shared/owner'
import { Card, Field } from '../../components/ui'
import { useInvoices, useReminders } from '../../features/queries'
import { useAuth } from '../../auth/auth'
import { theme } from '../../theme/theme'

/**
 * The rental module's index of everything that does not need a tab of its own.
 * Counts come from queries the other tabs already warmed, so this costs nothing
 * extra to render.
 */
export function MoreScreen() {
  const navigation = useNavigation()
  const { email } = useAuth()
  const invoices = useInvoices()
  const reminders = useReminders()

  const outstanding = (invoices.data ?? []).reduce(
    (sum, invoice) => sum + invoice.outstanding_amount,
    0,
  )

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <Field label="Signed in" value={email ?? '—'} />
        <Field label="Outstanding" value={formatCurrency(outstanding)} />
      </Card>

      <View style={styles.group}>
        <Row label="Receipts" onPress={() => navigation.navigate('Receipts')} />
        <Row label="Documents" onPress={() => navigation.navigate('Documents')} />
        <Row
          label="Reminders"
          badge={reminders.data?.length ? String(reminders.data.length) : undefined}
          onPress={() => navigation.navigate('Reminders')}
        />
        <Row label="Your profile" onPress={() => navigation.navigate('Profile')} />
      </View>
    </ScrollView>
  )
}

function Row({
  label,
  badge,
  onPress,
}: {
  label: string
  badge?: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        <ChevronRight size={18} color={theme.color.muted} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(4), paddingBottom: theme.space(10) },
  group: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    borderBottomColor: theme.color.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: { backgroundColor: theme.color.surfaceAlt },
  rowLabel: { color: theme.color.text, fontSize: 15 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: theme.space(2) },
  badge: {
    backgroundColor: theme.color.accent,
    color: theme.color.accentText,
    fontSize: 11,
    fontWeight: '800',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space(2),
    paddingVertical: 2,
    overflow: 'hidden',
  },
})
