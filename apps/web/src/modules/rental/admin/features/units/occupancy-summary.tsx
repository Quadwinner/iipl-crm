import type { Uuid } from '@itoby/shared'
import { Skeleton } from '@rental-admin/components/ui/skeleton'
import { useOccupancySummary } from './api'

interface OccupancySummaryRowProps {
  /** null scopes the counts to the whole inventory (Requirement 2.3). */
  buildingId: Uuid | null
  /** Building name when scoped, for the caption. */
  scopeLabel?: string
}

const numberFormat = new Intl.NumberFormat('en-IN')

export function OccupancySummaryRow({ buildingId, scopeLabel }: OccupancySummaryRowProps) {
  const { data, isPending, isError, error } = useOccupancySummary(buildingId)

  return (
    <section aria-labelledby="occupancy-heading" className="space-y-2">
      <h2 id="occupancy-heading" className="text-muted-foreground text-xs font-medium uppercase">
        Occupancy{scopeLabel ? ` · ${scopeLabel}` : ''}
      </h2>

      {isError ? (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      ) : (
        <dl className="divide-border flex flex-wrap items-stretch divide-x">
          <Stat label="Occupied" value={data?.occupiedCount} loading={isPending} />
          <Stat label="Vacant" value={data?.vacantCount} loading={isPending} />
          <Stat label="Total" value={data?.totalCount} loading={isPending} />
        </dl>
      )}
    </section>
  )
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="flex min-w-28 flex-col gap-0.5 pr-6 first:pl-0 [&:not(:first-child)]:pl-6">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-2xl leading-tight tabular-nums">
        {loading ? <Skeleton className="h-7 w-12" /> : numberFormat.format(value ?? 0)}
      </dd>
    </div>
  )
}
