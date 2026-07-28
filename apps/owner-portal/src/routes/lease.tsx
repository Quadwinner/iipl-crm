import { useMemo } from 'react'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/use-auth'
import {
  useDownloadOwnerDocument,
  useOwnerDocuments,
  type OwnerDocumentRow,
} from '@/features/documents/api'
import { daysUntil, useOwnerLeases, type OwnerLeaseRow } from '@/features/lease/api'
import { formatCurrency, formatDate } from '@/lib/format'

const STATUS_LABELS: Record<OwnerLeaseRow['status'], string> = {
  ACTIVE: 'Active',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
}

export function LeaseScreen() {
  const { owner } = useAuth()
  const leases = useOwnerLeases()
  const documents = useOwnerDocuments(owner?.ownerId ?? '')
  const download = useDownloadOwnerDocument()

  const active = useMemo(
    () => (leases.data ?? []).filter((row) => row.status === 'ACTIVE'),
    [leases.data],
  )
  const past = useMemo(
    () => (leases.data ?? []).filter((row) => row.status !== 'ACTIVE'),
    [leases.data],
  )

  async function onDownload(documentId: string, fileName: string) {
    try {
      await download.mutateAsync(documentId)
      toast.success(`Opening ${fileName}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed.')
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="My lease"
        description="Lease terms for your allotted office units and linked documents."
      />

      {leases.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {leases.error.message}
        </p>
      ) : null}

      {leases.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (leases.data ?? []).length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No leases yet</EmptyTitle>
            <EmptyDescription>
              When an office unit is allotted to you, the lease details appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Active
            </h2>
            {active.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active leases.</p>
            ) : (
              <div className="grid gap-3">
                {active.map((lease) => (
                  <LeaseCard
                    key={lease.id}
                    lease={lease}
                    documents={(documents.data ?? []).filter(
                      (doc) => doc.lease_id === lease.lease_id,
                    )}
                    onDownload={onDownload}
                  />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Past leases
              </h2>
              <div className="grid gap-3">
                {past.map((lease) => (
                  <LeaseCard
                    key={lease.id}
                    lease={lease}
                    documents={(documents.data ?? []).filter(
                      (doc) => doc.lease_id === lease.lease_id,
                    )}
                    onDownload={onDownload}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </section>
  )
}

function LeaseCard({
  lease,
  documents,
  onDownload,
}: {
  lease: OwnerLeaseRow
  documents: OwnerDocumentRow[]
  onDownload: (id: string, fileName: string) => void
}) {
  const remaining = daysUntil(lease.lease_end)

  return (
    <Card className="py-4">
      <CardHeader className="px-4 pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span>
            {lease.building_name} · {lease.unit_code}
          </span>
          <Badge variant={lease.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {STATUS_LABELS[lease.status]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 text-sm">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">Lease period</dt>
            <dd>
              {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Rent</dt>
            <dd className="font-mono tabular-nums">
              {formatCurrency(lease.rent_amount)} · {lease.billing_cycle ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Floor / size</dt>
            <dd>
              Floor {lease.floor ?? '—'}
              {lease.size_sqft != null ? ` · ${lease.size_sqft} sq ft` : ''}
            </dd>
          </div>
          {lease.status === 'ACTIVE' && remaining !== null ? (
            <div>
              <dt className="text-muted-foreground text-xs">Remaining</dt>
              <dd>
                {remaining < 0
                  ? `Ended ${Math.abs(remaining)} days ago`
                  : remaining === 0
                    ? 'Ends today'
                    : `${remaining} days`}
              </dd>
            </div>
          ) : null}
        </dl>

        {documents.length > 0 ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Lease documents
            </p>
            <ul className="space-y-1">
              {documents.map((doc) => {
                const name = `${doc.file_name}.${doc.file_extension}`
                return (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(doc.id, name)}
                    >
                      Download
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
