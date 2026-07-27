import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllotments } from '@/features/allotments/api'
import { AllotmentStatusBadge } from '@/features/allotments/allotment-status-badge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { OwnerRow } from './api'

interface OwnerDetailSheetProps {
  owner: OwnerRow | null
  onClose: () => void
}

export function OwnerDetailSheet({ owner, onClose }: OwnerDetailSheetProps) {
  const allotments = useAllotments({ status: null, ownerId: owner?.id ?? null })

  return (
    <Sheet
      open={owner !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{owner?.name ?? 'Owner'}</SheetTitle>
          <SheetDescription>{owner?.contact_email ?? ''}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-6">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{owner?.phone ?? '—'}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              {owner ? (
                <Badge variant={owner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {owner.status === 'ACTIVE' ? 'Active' : 'Deactivated'}
                </Badge>
              ) : (
                '—'
              )}
            </dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDateTime(owner?.created_at)}</dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{formatDateTime(owner?.updated_at)}</dd>
          </dl>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Allotments</h3>
            {allotments.isPending ? (
              <div className="space-y-2" aria-live="polite" aria-busy="true">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : allotments.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {allotments.error.message}
              </p>
            ) : (allotments.data ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No allotments for this owner.</p>
            ) : (
              <ul className="divide-y">
                {(allotments.data ?? []).map((allotment) => (
                  <li key={allotment.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0 space-y-0.5 text-sm">
                      <p className="truncate font-medium">
                        {allotment.building_name} · {allotment.unit_code}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDate(allotment.lease_start)} – {formatDate(allotment.lease_end)}
                      </p>
                      <p className="text-muted-foreground">
                        {formatCurrency(allotment.rent_amount)}
                      </p>
                    </div>
                    <AllotmentStatusBadge status={allotment.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
