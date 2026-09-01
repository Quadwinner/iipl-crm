import type { Uuid } from '@itoby/shared'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import { formatCurrency, formatDate } from '@/lib/format'
import { AllotmentStatusBadge } from './allotment-status-badge'
import { useAllotmentHistory } from './api'

export interface HistoryTarget {
  unitId: Uuid
  label: string
}

interface AllotmentHistorySheetProps {
  target: HistoryTarget | null
  onClose: () => void
}

export function AllotmentHistorySheet({ target, onClose }: AllotmentHistorySheetProps) {
  const history = useAllotmentHistory(target?.unitId ?? null)

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Allotment history</SheetTitle>
          <SheetDescription>{target?.label ?? ''}</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-4 pb-6">
          {history.isPending ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : history.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {history.error.message}
            </p>
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">This unit has never been allotted.</p>
          ) : (
            <ol className="divide-y">
              {(history.data ?? []).map((entry) => (
                <li key={entry.allotment_id} className="space-y-2 py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{entry.owner_name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {entry.owner_contact_email}
                      </p>
                    </div>
                    <AllotmentStatusBadge status={entry.status} />
                  </div>

                  <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Lease</dt>
                    <dd>
                      {formatDate(entry.lease_start_date)} – {formatDate(entry.lease_end_date)}
                    </dd>
                    <dt className="text-muted-foreground">Rent</dt>
                    <dd>
                      {formatCurrency(entry.rent_amount)} · {cycleLabel(entry.billing_cycle)}
                    </dd>
                    {entry.terminated_at ? (
                      <>
                        <dt className="text-muted-foreground">Ended</dt>
                        <dd>{formatDate(entry.terminated_at)}</dd>
                      </>
                    ) : null}
                    {entry.expiration_reason ? (
                      <>
                        <dt className="text-muted-foreground">Reason</dt>
                        <dd className="break-words">{entry.expiration_reason}</dd>
                      </>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function cycleLabel(cycle: string): string {
  return cycle.charAt(0) + cycle.slice(1).toLowerCase()
}
