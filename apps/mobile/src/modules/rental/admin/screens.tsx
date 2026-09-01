import { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { RootParamList } from '../../../navigation/types'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatCurrency, formatDate, formatTimestamp } from '@itoby/shared/owner'
import type { AdminComplaintRow } from '@itoby/shared/admin'
import { Badge, Card, Empty, ErrorState, Field, Loading } from '../../../components/ui'
import { SectionHeader } from '../../../components/section'
import {
  useAdminComplaints,
  useBuildings,
  useOccupancy,
  useOwners,
  useStaff,
  useUnits,
} from './queries'
import { useStyles, useTheme, type Theme } from '../../../theme/theme'

/** Portfolio at a glance: occupancy across every building, then the buildings themselves. */
export function AdminDashboardScreen() {
  const styles = useStyles(makeStyles)
  const occupancy = useOccupancy(null)
  const buildings = useBuildings()
  const complaints = useAdminComplaints()

  const open = (complaints.data ?? []).filter(
    (row) => row.status === 'OPEN' || row.status === 'IN_PROGRESS',
  ).length

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Rental" title="Overview" />

      <View style={styles.tiles}>
        <Tile label="Units" value={String(occupancy.data?.totalCount ?? '—')} />
        <Tile label="Occupied" value={String(occupancy.data?.occupiedCount ?? '—')} tone="ok" />
        <Tile label="Vacant" value={String(occupancy.data?.vacantCount ?? '—')} tone="warn" />
        <Tile label="Open complaints" value={String(open)} tone={open > 0 ? 'warn' : 'ok'} />
      </View>

      <Text style={styles.sectionTitle}>Buildings</Text>
      {buildings.isPending ? <Loading /> : null}
      {buildings.error ? (
        <ErrorState error={buildings.error} onRetry={() => void buildings.refetch()} />
      ) : null}
      {(buildings.data ?? []).map((building) => (
        <Card key={building.id}>
          <Text style={styles.title}>{building.name}</Text>
          <Field label="Address" value={building.address || '—'} />
          <Field label="Units" value={String(building.unit_count)} />
        </Card>
      ))}
    </ScrollView>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const color =
    tone === 'ok' ? theme.color.ok : tone === 'warn' ? theme.color.warn : theme.color.accent
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  )
}

export function AdminBuildingsScreen() {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const buildings = useBuildings()

  if (buildings.isPending) return <Loading />
  if (buildings.error) return <ErrorState error={buildings.error} onRetry={() => void buildings.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={buildings.data ?? []}
      keyExtractor={(building) => building.id}
      refreshing={buildings.isRefetching}
      onRefresh={() => void buildings.refetch()}
      ListEmptyComponent={<Empty title="No buildings yet" />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AdminUnits', { buildingId: item.id, name: item.name })}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <Card>
            <Text style={styles.title}>{item.name}</Text>
            <Field label="Address" value={item.address || '—'} />
            <Field label="Units" value={String(item.unit_count)} />
          </Card>
        </Pressable>
      )}
    />
  )
}

export function AdminUnitsScreen() {
  const styles = useStyles(makeStyles)
  const route = useRoute<RouteProp<RootParamList, 'AdminUnits'>>()
  const buildingId = route.params?.buildingId ?? null
  const units = useUnits(buildingId)

  if (units.isPending) return <Loading />
  if (units.error) return <ErrorState error={units.error} onRetry={() => void units.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={units.data ?? []}
      keyExtractor={(unit) => unit.id}
      refreshing={units.isRefetching}
      onRefresh={() => void units.refetch()}
      ListEmptyComponent={<Empty title="No units" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.unit_code}</Text>
            <Badge label={item.occupancy_status} />
          </View>
          <Field label="Building" value={item.building_name} />
          {item.floor !== null ? <Field label="Floor" value={String(item.floor)} /> : null}
          {item.size_sqft !== null ? <Field label="Size" value={`${item.size_sqft} sqft`} /> : null}
          <Field label="Base rent" value={formatCurrency(item.base_rent_amount)} />
        </Card>
      )}
    />
  )
}

export function AdminTenantsScreen() {
  const styles = useStyles(makeStyles)
  const owners = useOwners()

  if (owners.isPending) return <Loading />
  if (owners.error) return <ErrorState error={owners.error} onRetry={() => void owners.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={owners.data ?? []}
      keyExtractor={(owner) => owner.id}
      refreshing={owners.isRefetching}
      onRefresh={() => void owners.refetch()}
      ListEmptyComponent={<Empty title="No tenants yet" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <Badge label={item.status} />
          </View>
          <Field label="Email" value={item.contact_email} />
          <Field label="Phone" value={item.phone || '—'} />
          <Field label="Since" value={formatDate(item.created_at)} />
        </Card>
      )}
    />
  )
}

export function AdminStaffScreen() {
  const styles = useStyles(makeStyles)
  const staff = useStaff()

  if (staff.isPending) return <Loading />
  if (staff.error) return <ErrorState error={staff.error} onRetry={() => void staff.refetch()} />

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={staff.data ?? []}
      keyExtractor={(row) => row.user_id}
      refreshing={staff.isRefetching}
      onRefresh={() => void staff.refetch()}
      ListEmptyComponent={<Empty title="No maintenance staff yet" />}
      renderItem={({ item }) => (
        <Card>
          <View style={styles.header}>
            <Text style={styles.title}>{item.full_name || item.email}</Text>
            <Badge label={item.is_active ? 'ACTIVE' : 'DISABLED'} />
          </View>
          <Field label="Email" value={item.email} />
          {item.phone ? <Field label="Phone" value={item.phone} /> : null}
        </Card>
      )}
    />
  )
}

/** The complaints queue. Tapping one opens the screen where it can be worked. */
export function AdminComplaintsScreen() {
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | null>(null)
  const complaints = useAdminComplaints({
    category: null,
    status,
    officeOwnerId: null,
    createdFrom: null,
    createdTo: null,
  })

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
        <View style={styles.filters}>
          {([null, 'OPEN', 'IN_PROGRESS'] as const).map((option) => (
            <Text
              key={option ?? 'all'}
              onPress={() => setStatus(option)}
              style={[styles.chip, option === status && styles.chipActive]}
            >
              {option === null ? 'All' : option.replace('_', ' ')}
            </Text>
          ))}
        </View>
      }
      ListEmptyComponent={<Empty title="Nothing in the queue" />}
      renderItem={({ item }: { item: AdminComplaintRow }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('AdminComplaintDetail', { complaint: item })}
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          <Card>
            <View style={styles.header}>
              <Text style={styles.title}>{item.category}</Text>
              <Badge label={item.status} />
            </View>
            <Text style={styles.body} numberOfLines={2}>
              {item.description}
            </Text>
            <Field label="Unit" value={`${item.unit_code} · ${item.building_name}`} />
            <Field label="Tenant" value={item.owner_name} />
            <Field label="Raised" value={formatTimestamp(item.created_at)} />
            <Field label="Assigned" value={item.assigned_to ? 'Yes' : 'Unassigned'} />
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
  body: { color: theme.color.muted, fontSize: 13, lineHeight: 20, marginBottom: theme.space(3) },
  sectionTitle: {
    color: theme.color.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: theme.space(6),
    marginBottom: theme.space(4),
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3) },
  tile: {
    width: '47.5%',
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
  },
  tileValue: { fontSize: 26, fontWeight: '800' },
  tileLabel: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(1) },
  filters: { flexDirection: 'row', gap: theme.space(2), marginBottom: theme.space(4) },
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
})
