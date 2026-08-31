import { useState } from 'react'
import { Plus } from 'lucide-react'
import { OCCUPANCY_STATUSES, type OccupancyStatus } from '@itoby/shared'
import { useAuth } from '@rental-admin/auth/use-auth'
import { Button } from '@rental-admin/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@rental-admin/components/ui/empty'
import { Label } from '@rental-admin/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rental-admin/components/ui/select'
import { Separator } from '@rental-admin/components/ui/separator'
import { Skeleton } from '@rental-admin/components/ui/skeleton'
import { useBuildings, useUnits, type UnitFilters } from '@rental-admin/features/units/api'
import { OCCUPANCY_LABELS } from '@rental-admin/features/units/labels'
import { OccupancySummaryRow } from '@rental-admin/features/units/occupancy-summary'
import { UnitFormDialog, type UnitFormTarget } from '@rental-admin/features/units/unit-form-dialog'
import { UnitsTable } from '@rental-admin/features/units/units-table'

const ALL = 'ALL'

export function UnitsPage() {
  const { role } = useAuth()
  const canWrite = role === 'ADMINISTRATOR'

  const [filters, setFilters] = useState<UnitFilters>({ buildingId: null, occupancyStatus: null })
  const [formTarget, setFormTarget] = useState<UnitFormTarget | null>(null)

  const buildings = useBuildings()
  const units = useUnits(filters)

  const filtered = filters.buildingId !== null || filters.occupancyStatus !== null
  const scopeLabel = buildings.data?.find((b) => b.id === filters.buildingId)?.name

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Office units</h1>
        {canWrite ? (
          <Button type="button" size="sm" onClick={() => setFormTarget({ mode: 'create' })}>
            <Plus aria-hidden="true" />
            New unit
          </Button>
        ) : null}
      </div>

      <OccupancySummaryRow buildingId={filters.buildingId} scopeLabel={scopeLabel} />

      <Separator />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-building">Building</Label>
          <Select
            value={filters.buildingId ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                buildingId: value === ALL ? null : value,
              }))
            }
          >
            <SelectTrigger id="filter-building" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All buildings</SelectItem>
              {(buildings.data ?? []).map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-occupancy">Occupancy status</Label>
          <Select
            value={filters.occupancyStatus ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                occupancyStatus: value === ALL ? null : (value as OccupancyStatus),
              }))
            }
          >
            <SelectTrigger id="filter-occupancy" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {OCCUPANCY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {OCCUPANCY_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ buildingId: null, occupancyStatus: null })}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {units.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {units.error.message}
        </p>
      ) : units.isPending ? (
        <div aria-live="polite" className="space-y-2">
          <span className="sr-only">Loading office units</span>
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-9 w-full" />
          ))}
        </div>
      ) : units.data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{filtered ? 'No office units match' : 'No office units'}</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? 'No units match the selected building and occupancy status.'
                : 'Add a unit to start the register.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <UnitsTable
            units={units.data}
            canEdit={canWrite}
            onEdit={(unit) => setFormTarget({ mode: 'edit', unit })}
          />
          <p aria-live="polite" className="text-muted-foreground text-xs">
            {units.data.length} {units.data.length === 1 ? 'unit' : 'units'}
          </p>
        </>
      )}

      <UnitFormDialog
        target={formTarget}
        buildings={buildings.data ?? []}
        onClose={() => setFormTarget(null)}
      />
    </section>
  )
}
