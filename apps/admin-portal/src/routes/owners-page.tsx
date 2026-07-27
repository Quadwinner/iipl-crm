import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { OWNER_STATUSES, type OwnerStatus } from '@itoby/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useOwners, type OwnerFilters, type OwnerRow } from '@/features/owners/api'
import { CreateOwnerDialog } from '@/features/owners/create-owner-dialog'
import { DeactivateOwnerDialog } from '@/features/owners/deactivate-owner-dialog'
import { OwnerDetailSheet } from '@/features/owners/owner-detail-sheet'
import { formatDateTime } from '@/lib/format'

const ALL = 'ALL'

const STATUS_LABELS: Record<OwnerStatus, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
}

export function OwnersPage() {
  const [filters, setFilters] = useState<OwnerFilters>({ status: null })
  const [detail, setDetail] = useState<OwnerRow | null>(null)
  const [pendingDeactivation, setPendingDeactivation] = useState<OwnerRow | null>(null)

  const owners = useOwners(filters)

  const columns = useMemo(() => {
    const column = createColumnHelper<OwnerRow>()
    return [
      column.accessor('name', {
        header: 'Name',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      column.accessor('contact_email', { header: 'Contact email' }),
      column.accessor('phone', { header: 'Phone' }),
      column.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() === 'ACTIVE' ? 'default' : 'secondary'}>
            {STATUS_LABELS[info.getValue()]}
          </Badge>
        ),
      }),
      column.accessor('created_at', {
        header: 'Created',
        cell: (info) => (
          <span className="whitespace-nowrap">{formatDateTime(info.getValue())}</span>
        ),
      }),
      column.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1 whitespace-nowrap">
            <Button type="button" variant="ghost" size="sm" onClick={() => setDetail(row.original)}>
              View
            </Button>
            {row.original.status === 'ACTIVE' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPendingDeactivation(row.original)}
              >
                Deactivate
              </Button>
            ) : null}
          </div>
        ),
      }),
    ]
  }, [])

  const table = useReactTable({
    data: owners.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Office owners</h1>
          <p className="text-muted-foreground text-sm">
            Owner accounts, contact details, and account status.
          </p>
        </div>
        <CreateOwnerDialog />
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="owner-status-filter">Status</Label>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              setFilters({ status: value === ALL ? null : (value as OwnerStatus) })
            }
          >
            <SelectTrigger id="owner-status-filter" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {OWNER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {owners.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {owners.error.message}
        </p>
      ) : null}

      {owners.isPending ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === 'actions' ? 'text-right' : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground">
                  No owner accounts match this filter.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <OwnerDetailSheet owner={detail} onClose={() => setDetail(null)} />
      <DeactivateOwnerDialog
        owner={pendingDeactivation}
        onClose={() => setPendingDeactivation(null)}
      />
    </section>
  )
}
