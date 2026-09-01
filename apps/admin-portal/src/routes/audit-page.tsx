import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ScrollText } from 'lucide-react'
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
import {
  AUDIT_PAGE_SIZE,
  EMPTY_AUDIT_FILTERS,
  useAuditFacets,
  useAuditLog,
  type AuditFilters,
  type AuditRow,
} from '@/features/audit/api'
import { ROLE_LABELS } from '@/lib/navigation'

const ANY = '__any'

const timestampFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const columnHelper = createColumnHelper<AuditRow>()
const NO_ROWS: AuditRow[] = []

export function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_AUDIT_FILTERS)

  const facets = useAuditFacets()
  const entries = useAuditLog(filters)

  const rows = entries.data?.rows ?? NO_ROWS
  const hasMore = entries.data?.hasMore ?? false

  const columns = useMemo(
    () => [
      columnHelper.accessor('created_at', {
        header: 'Timestamp',
        cell: (info) => (
          <time dateTime={info.getValue()} className="whitespace-nowrap tabular-nums">
            {timestampFormat.format(new Date(info.getValue()))}
          </time>
        ),
      }),
      columnHelper.display({
        id: 'actor',
        header: 'Acting user',
        cell: ({ row }) => (
          <span className="block">
            {row.original.actor_email ?? '—'}
            {row.original.actor_role ? (
              <span className="text-muted-foreground">
                {' '}
                · {ROLE_LABELS[row.original.actor_role]}
              </span>
            ) : null}
          </span>
        ),
      }),
      columnHelper.accessor('action_type', {
        header: 'Action',
        cell: (info) => <span className="font-medium whitespace-nowrap">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'record',
        header: 'Affected record',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.entity_type}
            <span className="text-muted-foreground font-mono" title={row.original.entity_id}>
              {' '}
              {row.original.entity_id.slice(0, 8)}
            </span>
          </span>
        ),
      }),
      columnHelper.display({
        id: 'change',
        header: 'Change',
        cell: ({ row }) =>
          row.original.field_name ? (
            <span className="text-sm">
              <span className="text-muted-foreground">{row.original.field_name}: </span>
              <span className="font-mono">{row.original.old_value ?? '—'}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="font-mono">{row.original.new_value ?? '—'}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  /** Any filter change restarts pagination, otherwise the offset points into a stale set. */
  function patch(next: Partial<AuditFilters>) {
    setFilters((current) => ({ ...current, ...next, offset: 0 }))
  }

  const filtered =
    filters.actorUserId !== null ||
    filters.actionType !== null ||
    filters.fromDate !== null ||
    filters.toDate !== null

  const firstIndex = rows.length === 0 ? 0 : filters.offset + 1
  const lastIndex = filters.offset + rows.length

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Recorded actions, newest first. Entries cannot be edited or removed.
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audit-actor">User</Label>
          <Select
            value={filters.actorUserId ?? ANY}
            onValueChange={(value) => patch({ actorUserId: value === ANY ? null : value })}
          >
            <SelectTrigger id="audit-actor" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All users</SelectItem>
              {(facets.data?.actors ?? []).map((actor) => (
                <SelectItem key={actor.id} value={actor.id}>
                  {actor.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-action">Action type</Label>
          <Select
            value={filters.actionType ?? ANY}
            onValueChange={(value) => patch({ actionType: value === ANY ? null : value })}
          >
            <SelectTrigger id="audit-action" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All actions</SelectItem>
              {(facets.data?.actionTypes ?? []).map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-from">From</Label>
          <Input
            id="audit-from"
            type="date"
            className="w-40"
            value={filters.fromDate ?? ''}
            onChange={(event) => patch({ fromDate: event.target.value || null })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to">To</Label>
          <Input
            id="audit-to"
            type="date"
            className="w-40"
            value={filters.toDate ?? ''}
            onChange={(event) => patch({ toDate: event.target.value || null })}
          />
        </div>

        {filtered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_AUDIT_FILTERS)}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {facets.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {facets.error.message}
        </p>
      ) : null}

      {entries.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : entries.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {entries.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollText aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No entries</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? 'No audit entries match the current filters.'
                : 'Entries appear here as allotments, invoices, payments, and accounts change.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
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
                    <TableCell key={cell.id} className="py-1.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center gap-3">
            <p aria-live="polite" className="text-muted-foreground text-sm">
              Entries {firstIndex}–{lastIndex}
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.offset === 0}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    offset: Math.max(0, current.offset - AUDIT_PAGE_SIZE),
                  }))
                }
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    offset: current.offset + AUDIT_PAGE_SIZE,
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
