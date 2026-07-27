import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { BillingReportRow } from '@itoby/shared'
import { Download, IndianRupee } from 'lucide-react'
import { useAuth } from '@/auth/use-auth'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
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
import { InvoiceStatusBadge } from '@/features/billing/status-badge'
import {
  dateRangeError,
  defaultDashboardFilters,
  useExportReport,
  useReportSnapshot,
  type DashboardFilters,
} from '@/features/reporting/api'
import { useBuildings } from '@/features/units/api'
import { formatCurrency, formatDate } from '@/lib/format'

const ALL_BUILDINGS = '__all'

const numberFormat = new Intl.NumberFormat('en-IN')
const columnHelper = createColumnHelper<BillingReportRow>()
const NO_ROWS: BillingReportRow[] = []

export function DashboardPage() {
  const { role } = useAuth()
  const isAdministrator = role === 'ADMINISTRATOR'

  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters)
  const rangeError = dateRangeError(filters)

  const buildings = useBuildings()
  const snapshot = useReportSnapshot(filters, isAdministrator && rangeError === null)
  const exportReport = useExportReport()

  const rows = snapshot.data?.billingRows ?? NO_ROWS

  const columns = useMemo(
    () => [
      columnHelper.accessor('billingCycleKey', { header: 'Cycle' }),
      columnHelper.accessor('ownerName', { header: 'Office owner' }),
      columnHelper.display({
        id: 'unit',
        header: 'Office unit',
        cell: ({ row }) => (
          <span>
            {row.original.unitCode}
            <span className="text-muted-foreground"> · {row.original.buildingName}</span>
          </span>
        ),
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due',
        cell: (info) => <time dateTime={info.getValue()}>{formatDate(info.getValue())}</time>,
      }),
      columnHelper.accessor('totalAmount', {
        header: () => <span className="block text-right">Amount</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {formatCurrency(info.getValue())}
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

  function patch(next: Partial<DashboardFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  const occupancy = snapshot.data?.occupancy
  const revenue = snapshot.data?.revenue
  const loading = snapshot.isPending && snapshot.fetchStatus !== 'idle'
  const exportDisabled = rangeError !== null || exportReport.isPending

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Occupancy and revenue for the selected building and date range.
        </p>
      </div>

      <Separator />

      {!isAdministrator ? (
        <p className="text-muted-foreground text-sm">
          Occupancy and revenue reporting is limited to administrators.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dashboard-building">Building</Label>
              <Select
                value={filters.buildingId ?? ALL_BUILDINGS}
                onValueChange={(value) =>
                  patch({ buildingId: value === ALL_BUILDINGS ? null : value })
                }
              >
                <SelectTrigger id="dashboard-building" className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_BUILDINGS}>All buildings</SelectItem>
                  {(buildings.data ?? []).map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dashboard-start">From</Label>
              <Input
                id="dashboard-start"
                type="date"
                className="w-40"
                value={filters.startDate}
                aria-invalid={rangeError ? true : undefined}
                aria-describedby={rangeError ? 'dashboard-range-error' : undefined}
                onChange={(event) => patch({ startDate: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dashboard-end">To</Label>
              <Input
                id="dashboard-end"
                type="date"
                className="w-40"
                value={filters.endDate}
                aria-invalid={rangeError ? true : undefined}
                aria-describedby={rangeError ? 'dashboard-range-error' : undefined}
                onChange={(event) => patch({ endDate: event.target.value })}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFilters(defaultDashboardFilters())}
            >
              Current month, all buildings
            </Button>

            <div className="ml-auto flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportDisabled}
                onClick={() => exportReport.mutate({ filters, format: 'csv' })}
              >
                <Download aria-hidden="true" />
                CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportDisabled}
                onClick={() => exportReport.mutate({ filters, format: 'pdf' })}
              >
                <Download aria-hidden="true" />
                PDF
              </Button>
            </div>
          </div>

          {rangeError ? (
            <p id="dashboard-range-error" role="alert" className="text-destructive text-sm">
              {rangeError}
            </p>
          ) : null}
          {buildings.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {buildings.error.message}
            </p>
          ) : null}
          {snapshot.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {snapshot.error.message}
            </p>
          ) : null}
          {exportReport.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {exportReport.error.message}
            </p>
          ) : null}

          <section aria-labelledby="dashboard-occupancy" className="space-y-2">
            <h2
              id="dashboard-occupancy"
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              Occupancy
            </h2>
            <dl className="divide-border flex flex-wrap items-stretch divide-x">
              <Stat
                label="Total units"
                value={numberFormat.format(occupancy?.totalUnits ?? 0)}
                loading={loading}
              />
              <Stat
                label="Occupied"
                value={numberFormat.format(occupancy?.occupiedCount ?? 0)}
                loading={loading}
              />
              <Stat
                label="Vacant"
                value={numberFormat.format(occupancy?.vacantCount ?? 0)}
                loading={loading}
              />
              <Stat
                label="Occupancy rate"
                value={`${occupancy?.occupancyRatePercent ?? 0}%`}
                loading={loading}
              />
            </dl>
          </section>

          <section aria-labelledby="dashboard-revenue" className="space-y-2">
            <h2
              id="dashboard-revenue"
              className="text-muted-foreground text-xs font-medium uppercase"
            >
              Revenue · {formatDate(revenue?.rangeStart ?? filters.startDate)} –{' '}
              {formatDate(revenue?.rangeEnd ?? filters.endDate)}
            </h2>
            <dl className="divide-border flex flex-wrap items-stretch divide-x">
              <Stat
                label="Rent collected"
                value={formatCurrency(revenue?.totalRentCollected ?? 0)}
                loading={loading}
              />
              <Stat
                label="Outstanding dues"
                value={formatCurrency(revenue?.totalOutstandingDues ?? 0)}
                loading={loading}
              />
              <Stat
                label="Overdue invoices"
                value={numberFormat.format(revenue?.overdueInvoiceCount ?? 0)}
                loading={loading}
              />
            </dl>
          </section>

          <h2 className="text-muted-foreground text-xs font-medium uppercase">Invoices in range</h2>

          {loading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IndianRupee aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>No invoices</EmptyTitle>
                <EmptyDescription>
                  No invoices fall in the selected date range for this building.
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
        </>
      )}
    </section>
  )
}

function Stat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="flex min-w-32 flex-col gap-0.5 pr-6 first:pl-0 [&:not(:first-child)]:pl-6">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-xl leading-tight tabular-nums">
        {loading ? <Skeleton className="h-6 w-20" /> : value}
      </dd>
    </div>
  )
}
