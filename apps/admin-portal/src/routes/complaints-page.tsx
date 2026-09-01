import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { COMPLAINT_STATUSES, type ComplaintStatus, type Uuid } from '@itoby/shared'
import { Wrench } from 'lucide-react'
import { Button } from '@itoby/ui'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@itoby/ui'
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
import { useAuth } from '@/auth/use-auth'
import {
  EMPTY_COMPLAINT_FILTERS,
  useComplaintCategories,
  useComplaints,
  useMaintenanceStaff,
  type ComplaintFilters,
  type ComplaintRow,
} from '@/features/complaints/api'
import { ComplaintDetailDialog } from '@/features/complaints/complaint-detail-dialog'
import { ComplaintStatusBadge, complaintStatusLabel } from '@/features/complaints/status-badge'
import { useOwnerOptions } from '@/features/lookups/api'

const ANY = '__any'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

const columnHelper = createColumnHelper<ComplaintRow>()

export function ComplaintsPage() {
  const { role, session } = useAuth()
  const userId = session?.user.id ?? null
  const [filters, setFilters] = useState<ComplaintFilters>(EMPTY_COMPLAINT_FILTERS)
  const [selectedId, setSelectedId] = useState<Uuid | null>(null)

  const categories = useComplaintCategories()
  const owners = useOwnerOptions()
  const complaints = useComplaints(filters)

  // list_staff is Administrator-only, so Maintenance_Staff viewers keep the id fallback.
  const staff = useMaintenanceStaff(role === 'ADMINISTRATOR')
  const staffNames = useMemo(
    () => new Map((staff.data ?? []).map((member) => [member.user_id, member.name])),
    [staff.data],
  )

  /** Read the open complaint back out of the list so it refreshes after a mutation. */
  const selected = complaints.data?.find((row) => row.id === selectedId) ?? null

  const columns = useMemo(
    () => [
      columnHelper.accessor('created_at', {
        header: 'Raised',
        cell: (info) => (
          <time dateTime={info.getValue()}>{dateFormat.format(new Date(info.getValue()))}</time>
        ),
      }),
      columnHelper.accessor('category', { header: 'Category' }),
      columnHelper.display({
        id: 'unit',
        header: 'Office unit',
        cell: ({ row }) => (
          <span>
            {row.original.unit_code}
            <span className="text-muted-foreground"> · {row.original.building_name}</span>
          </span>
        ),
      }),
      columnHelper.accessor('owner_name', { header: 'Office owner' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <ComplaintStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('assigned_to', {
        header: 'Assigned to',
        cell: (info) => {
          const assignee = info.getValue() as Uuid | null
          if (!assignee) return <span className="text-muted-foreground">Unassigned</span>
          if (assignee === userId) return 'You'
          const name = staffNames.get(assignee)
          if (name) return name
          // A deactivated assignee is absent from the assignable list, so fall back to a
          // short id rather than rendering nothing.
          return (
            <span className="font-mono text-xs" title={assignee}>
              {assignee.slice(0, 8)}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'open',
        header: () => <span className="sr-only">Detail</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(row.original.id)}
          >
            Open
          </Button>
        ),
      }),
    ],
    [userId, staffNames],
  )

  const table = useReactTable({
    data: complaints.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  function patch(next: Partial<ComplaintFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  const filtered = Object.values(filters).some((value) => value !== null)

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Complaints</h1>
        <p className="text-muted-foreground text-sm">
          {role === 'MAINTENANCE_STAFF'
            ? 'All maintenance complaints. You can update the ones assigned to you.'
            : 'All maintenance complaints across buildings, owners, and units.'}
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-category">Category</Label>
          <Select
            value={filters.category ?? ANY}
            onValueChange={(value) => patch({ category: value === ANY ? null : value })}
          >
            <SelectTrigger id="filter-category" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All categories</SelectItem>
              {(categories.data ?? []).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={filters.status ?? ANY}
            onValueChange={(value) =>
              patch({ status: value === ANY ? null : (value as ComplaintStatus) })
            }
          >
            <SelectTrigger id="filter-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All statuses</SelectItem>
              {COMPLAINT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {complaintStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-owner">Office owner</Label>
          <Select
            value={filters.officeOwnerId ?? ANY}
            onValueChange={(value) => patch({ officeOwnerId: value === ANY ? null : value })}
          >
            <SelectTrigger id="filter-owner" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All owners</SelectItem>
              {(owners.data ?? []).map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-from">Raised from</Label>
          <Input
            id="filter-from"
            type="date"
            className="w-40"
            value={filters.createdFrom ?? ''}
            onChange={(event) => patch({ createdFrom: event.target.value || null })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-to">Raised to</Label>
          <Input
            id="filter-to"
            type="date"
            className="w-40"
            value={filters.createdTo ?? ''}
            onChange={(event) => patch({ createdTo: event.target.value || null })}
          />
        </div>

        {filtered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_COMPLAINT_FILTERS)}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {owners.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {owners.error.message}
        </p>
      ) : null}

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
      ) : table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No complaints</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? 'No complaints match the current filters.'
                : 'Complaints raised by office owners will appear here.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ComplaintDetailDialog complaint={selected} onClose={() => setSelectedId(null)} />
    </section>
  )
}
