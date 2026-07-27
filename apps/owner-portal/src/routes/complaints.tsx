import { useState } from 'react'
import { Wrench } from 'lucide-react'

import { ScreenHeader } from '@/components/screen-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
    <>
      <ScreenHeader title="Maintenance complaints" />

      <SubmitComplaintForm />

      <Separator className="my-8" />

      <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase">Your complaints</h2>

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
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No complaints</EmptyTitle>
            <EmptyDescription>Complaints you raise appear here with their status.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Raised</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Office unit</TableHead>
              <TableHead>Status</TableHead>
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
      )}

      <ComplaintDetailDialog complaint={open} onClose={() => setOpenId(null)} />
    </>
  )
}
