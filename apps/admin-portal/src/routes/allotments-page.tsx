import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ALLOTMENT_STATUSES, type AllotmentStatus, type Uuid } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAllotments,
  type AllotmentListRow,
  type AllotmentFilters,
} from '@/features/allotments/api'
import {
  AllotmentStatusBadge,
  allotmentStatusLabel,
} from '@/features/allotments/allotment-status-badge'
import {
  AllotmentHistorySheet,
  type HistoryTarget,
} from '@/features/allotments/allotment-history-sheet'
import { CreateAllotmentDialog } from '@/features/allotments/create-allotment-dialog'
import {
  TransitionAllotmentDialog,
  type TransitionRequest,
} from '@/features/allotments/transition-allotment-dialog'
import { useOwners } from '@/features/owners/api'
import { formatCurrency, formatDate, isPastDate } from '@/lib/format'

const ALL = 'ALL'

export function AllotmentsPage() {
  const [filters, setFilters] = useState<AllotmentFilters>({ status: 'ACTIVE', ownerId: null })
  const [transition, setTransition] = useState<TransitionRequest | null>(null)
  const [history, setHistory] = useState<HistoryTarget | null>(null)

  const allotments = useAllotments(filters)
  const owners = useOwners({ status: null })

  const columns = useMemo(() => {
    const column = createColumnHelper<AllotmentListRow>()
    return [
      column.accessor('unit_code', {
        header: 'Unit',
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{info.getValue()}</p>
            <p className="text-muted-foreground truncate">{info.row.original.building_name}</p>
          </div>
        ),
      }),
      column.accessor('owner_name', {
        header: 'Owner',
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate">{info.getValue()}</p>
            <p className="text-muted-foreground truncate">{info.row.original.owner_email}</p>
          </div>
        ),
      }),
      column.accessor('lease_start', {
        header: 'Lease',
        cell: (info) => (
          <span className="whitespace-nowrap">
            {formatDate(info.getValue())} – {formatDate(info.row.original.lease_end)}
          </span>
        ),
      }),
      column.accessor('rent_amount', {
        header: 'Rent',
        cell: (info) => (
          <span className="whitespace-nowrap">
            {formatCurrency(info.getValue())}
            {info.row.original.billing_cycle ? (
              <span className="text-muted-foreground">
                {' '}
                · {cycleLabel(info.row.original.billing_cycle)}
              </span>
            ) : null}
          </span>
        ),
      }),
      column.accessor('status', {
        header: 'Status',
        cell: (info) => <AllotmentStatusBadge status={info.getValue()} />,
      }),
      column.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const allotment = row.original
          const pastDue = isPastDate(allotment.lease_end)
          return (
            <div className="flex justify-end gap-1 whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setHistory({
                    unitId: allotment.office_unit_id,
                    label: `${allotment.building_name} · ${allotment.unit_code}`,
                  })
                }
              >
                History
              </Button>
              {allotment.status === 'ACTIVE' ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransition({ allotment, targetStatus: 'TERMINATED' })}
                  >
                    Terminate
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransition({ allotment, targetStatus: 'EXPIRED' })}
                  >
                    {pastDue ? 'Force expire' : 'Expire'}
                  </Button>
                </>
              ) : null}
            </div>
          )
        },
      }),
    ]
  }, [])

  const table = useReactTable({
    data: allotments.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Allotments</h1>
          <p className="text-muted-foreground text-sm">
            Leases per unit, with terminations and expirations.
          </p>
        </div>
        <CreateAllotmentDialog owners={owners.data ?? []} ownersLoading={owners.isPending} />
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter">Status</Label>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                status: value === ALL ? null : (value as AllotmentStatus),
              }))
            }
          >
            <SelectTrigger id="status-filter" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {ALLOTMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {allotmentStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner-filter">Owner</Label>
          <Select
            value={filters.ownerId ?? ALL}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                ownerId: value === ALL ? null : (value as Uuid),
              }))
            }
          >
            <SelectTrigger id="owner-filter" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All owners</SelectItem>
              {(owners.data ?? []).map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {allotments.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {allotments.error.message}
        </p>
      ) : null}

      {allotments.isPending ? (
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
                  No allotments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <TransitionAllotmentDialog request={transition} onClose={() => setTransition(null)} />
      <AllotmentHistorySheet target={history} onClose={() => setHistory(null)} />
    </section>
  )
}

function cycleLabel(cycle: string): string {
  return cycle.charAt(0) + cycle.slice(1).toLowerCase()
}
