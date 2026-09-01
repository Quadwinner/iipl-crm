import { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { RootParamList } from '../../navigation/types'
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  leadKeys,
  LEAD_STATUSES,
  listLeads,
  updateLeadStatus,
  type LeadStatus,
} from '@itoby/shared/site'
import { formatDate } from '@itoby/shared/owner'
import { Badge, Button, Card, Empty, ErrorState, Field, Loading } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { useStyles, type Theme, useTheme } from '../../theme/theme'

const Stack = createNativeStackNavigator()

/** Navigator options depend on the active theme, so they are built per render
 *  rather than frozen at module scope. */
const screenOptions = (theme: Theme) =>
  ({
    headerStyle: { backgroundColor: theme.color.bg },
    headerTitleStyle: { color: theme.color.text },
    headerTintColor: theme.color.accent,
    headerShadowVisible: false,
  }) as const

function useLeads() {
  return useQuery({ queryKey: leadKeys.all, queryFn: () => listLeads(supabase()) })
}

/**
 * The leads inbox — everything submitted through the website's contact and quote
 * forms, including the ones submitted from this app.
 *
 * Visibility is the LEAD_READ policy's decision, not this screen's: an account
 * without it simply reads zero rows.
 */
function LeadsScreen() {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const [status, setStatus] = useState<LeadStatus | null>(null)
  const leads = useLeads()

  if (leads.isPending) return <Loading />
  if (leads.error) return <ErrorState error={leads.error} onRetry={() => void leads.refetch()} />

  const rows = (leads.data ?? []).filter((lead) => status === null || lead.status === status)

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(lead) => lead.id}
      refreshing={leads.isRefetching}
      onRefresh={() => void leads.refetch()}
      ListHeaderComponent={
        <View style={styles.filters}>
          {([null, ...LEAD_STATUSES] as const).map((option) => (
            <Text
              key={option ?? 'all'}
              onPress={() => setStatus(option)}
              style={[styles.chip, option === status && styles.chipActive]}
            >
              {option ?? 'All'}
            </Text>
          ))}
        </View>
      }
      ListEmptyComponent={<Empty title="No leads" hint="Website enquiries arrive here." />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('LeadDetail', { lead: item })}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>{item.full_name}</Text>
              <Badge label={item.status} />
            </View>
            <Field label="Email" value={item.email} />
            {item.company ? <Field label="Company" value={item.company} /> : null}
            {item.service_interest ? <Field label="Wants" value={item.service_interest} /> : null}
            <Field label="Received" value={formatDate(item.created_at)} />
          </Card>
        </Pressable>
      )}
    />
  )
}

function LeadDetailScreen() {
  const styles = useStyles(makeStyles)
  const route = useRoute<RouteProp<RootParamList, 'LeadDetail'>>()
  const lead = route.params.lead
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const setStatus = useMutation({
    mutationFn: (status: LeadStatus) => updateLeadStatus(supabase(), { id: lead.id, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
    onError: (cause) => setError(cause instanceof Error ? cause.message : String(cause)),
  })

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{lead.full_name}</Text>
          <Badge label={lead.status} />
        </View>
        <Field label="Email" value={lead.email} />
        {lead.phone ? <Field label="Phone" value={lead.phone} /> : null}
        {lead.company ? <Field label="Company" value={lead.company} /> : null}
        {lead.service_interest ? <Field label="Interested in" value={lead.service_interest} /> : null}
        {lead.budget_range ? <Field label="Budget" value={lead.budget_range} /> : null}
        <Field label="Source" value={lead.source} />
        <Field label="Received" value={formatDate(lead.created_at)} />
      </Card>

      {lead.message ? (
        <Card>
          <Text style={styles.label}>Message</Text>
          <Text style={styles.message}>{lead.message}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button label="Email them" variant="ghost" onPress={() => void Linking.openURL(`mailto:${lead.email}`)} />
        {lead.phone ? (
          <Button label="Call them" variant="ghost" onPress={() => void Linking.openURL(`tel:${lead.phone}`)} />
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Move to</Text>
      <View style={styles.filters}>
        {LEAD_STATUSES.map((status) => (
          <Text
            key={status}
            onPress={() => {
              setError(null)
              setStatus.mutate(status)
            }}
            style={[styles.chip, status === lead.status && styles.chipActive]}
          >
            {status}
          </Text>
        ))}
      </View>
    </ScrollView>
  )
}

/** The superapp's own admin: leads today, the content CMS stays on the web. */
export function AdminModule() {
  const { theme } = useTheme()
  return (
    <Stack.Navigator screenOptions={screenOptions(theme)}>
      <Stack.Screen name="Leads" component={LeadsScreen} options={{ title: 'Leads' }} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: 'Lead' }} />
    </Stack.Navigator>
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
  label: { color: theme.color.muted, fontSize: 12, marginBottom: theme.space(2) },
  message: { color: theme.color.text, fontSize: 14, lineHeight: 21 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2), marginBottom: theme.space(4) },
  chip: {
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    color: theme.color.muted,
    fontSize: 12,
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
  actions: { gap: theme.space(3), marginVertical: theme.space(4) },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: theme.space(4),
    marginBottom: theme.space(3),
  },
  error: { color: theme.color.danger, fontSize: 13, marginBottom: theme.space(3), lineHeight: 20 },
})
