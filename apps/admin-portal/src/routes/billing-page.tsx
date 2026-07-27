import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { INVOICE_STATUSES, type InvoiceStatus } from '@itoby/shared'
import { IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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
import {
  billingTotals,
  EMPTY_BILLING_FILTERS,
  useBillingReport,
  type BillingFilters,
  type BillingRow,
} from '@/features/billing/api'
import { InvoiceStatusBadge, invoiceStatusLabel } from '@/features/billing/status-badge'
import { useOwnerOptions } from '@/features/lookups/api'
import { useBuildings } from '@/features/units/api'

const ANY = '__any'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })
const currencyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const columnHelper = createColumnHelper<BillingRow>()

/** Stable empty reference so the totals memo does not recompute on every render. */
const NO_ROWS: BillingRow[] = []

export function BillingPage() {
  const [filters, setFilters] = useState<BillingFilters>(EMPTY_BILLING_FILTERS)

  const buildings = useBuildings()
  const owners = useOwnerOptions()
  const report = useBillingReport(filters)

  const rows = report.data ?? NO_ROWS
  const totals = useMemo(() => billingTotals(rows), [rows])

  const columns = useMemo(
    () => [
      columnHelper.accessor('billing_cycle_key', { header: 'Cycle' }),
      columnHelper.accessor('owner_name', { header: 'Office owner' }),
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
      columnHelper.display({
        id: 'period',
        header: 'Billing period',
        cell: ({ row }) =>
          `${dateFormat.format(new Date(row.original.billing_period_start))} – ${dateFormat.format(
            new Date(row.original.billing_period_end),
          )}`,
      }),
      columnHelper.accessor('due_date', {
        header: 'Due',
        cell: (info) => (
          <time dateTime={info.getValue()}>{dateFormat.format(new Date(info.getValue()))}</time>
        ),
      }),
      columnHelper.accessor('total_amount', {
        header: () => <span className="block text-right">Amount</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {currencyFormat.format(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <InvoiceStatusBadge status={info.getValue()} />,
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  function patch(next: Partial<BillingFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  const filtered = Object.values(filters).some((value) => value !== null)

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm">
          Billing history and outstanding dues across all office owners.
        </p>
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-building">Building</Label>
          <Select
            value={filters.buildingId ?? ANY}
            onValueChange={(value) => patch({ buildingId: value === ANY ? null : value })}
          >
            <SelectTrigger id="filter-building" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All buildings</SelectItem>
              {(buildings.data ?? []).map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
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
          <Label htmlFor="filter-status">Invoice status</Label>
          <Select
            value={filters.status ?? ANY}
            onValueChange={(value) =>
              patch({ status: value === ANY ? null : (value as InvoiceStatus) })
            }
          >
            <SelectTrigger id="filter-status" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All statuses</SelectItem>
              {INVOICE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {invoiceStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_BILLING_FILTERS)}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {buildings.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {buildings.error.message}
        </p>
      ) : null}
      {owners.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {owners.error.message}
        </p>
      ) : null}

      <dl className="divide-border flex flex-wrap items-stretch divide-x">
        <Stat
          label="Outstanding dues"
          value={currencyFormat.format(totals.outstandingTotal)}
          loading={report.isPending}
        />
        <Stat
          label="Overdue"
          value={currencyFormat.format(totals.overdueTotal)}
          loading={report.isPending}
        />
        <Stat
          label="Invoiced"
          value={currencyFormat.format(totals.invoicedTotal)}
          loading={report.isPending}
        />
        <Stat label="Invoices" value={String(totals.invoiceCount)} loading={report.isPending} />
      </dl>

      <h2 className="text-muted-foreground text-xs font-medium uppercase">Billing history</h2>

      {report.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : report.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {report.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IndianRupee aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No invoices</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? 'No invoices match the current filters.'
                : 'Invoices appear here once billing cycles run.'}
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
    </section>
  )
}

function Stat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex min-w-36 flex-col gap-0.5 pr-6 first:pl-0 [&:not(:first-child)]:pl-6">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-xl leading-tight tabular-nums">
        {loading ? <Skeleton className="h-6 w-24" /> : value}
      </dd>
    </div>
  )
}
