import { useState } from 'react'
import { Wrench } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Button } from '@itoby/ui'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@itoby/ui'
import { Separator } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@itoby/ui'
import { useOwnerComplaints, type ComplaintRow } from '@/features/complaints/api'
import { ComplaintDetailDialog } from '@/features/complaints/complaint-detail-dialog'
import { ComplaintStatusBadge } from '@/features/complaints/status-badge'
import { SubmitComplaintForm } from '@/features/complaints/submit-complaint-form'
import { formatTimestamp } from '@/lib/format'

const NO_ROWS: ComplaintRow[] = []

export function ComplaintsScreen() {
  const complaints = useOwnerComplaints()
  const [openId, setOpenId] = useState<string | null>(null)

  const rows = complaints.data ?? NO_ROWS
  const open = rows.find((row) => row.id === openId) ?? null

  return (
    <section className="space-y-6">
      <PageHeader
        title="Maintenance complaints"
        description="Report issues with your office unit and track resolution status."
      />

      <SubmitComplaintForm />

      <Separator />

      <h2 className="section-label">Your complaints</h2>

      {complaints.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : complaints.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {complaints.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="surface-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No complaints</EmptyTitle>
            <EmptyDescription>Complaints you raise appear here with their status.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raised</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Office unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <time dateTime={row.created_at}>{formatTimestamp(row.created_at)}</time>
                </TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>
                  {row.unit_code}
                  <span className="text-muted-foreground"> · {row.building_name}</span>
                </TableCell>
                <TableCell>
                  <ComplaintStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  {row.assigned_to_name ?? (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setOpenId(row.id)}
                    aria-label={`View status history for the ${row.category} complaint on ${row.unit_code}`}
                  >
                    History
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      <ComplaintDetailDialog complaint={open} onClose={() => setOpenId(null)} />
    </section>
  )
}
