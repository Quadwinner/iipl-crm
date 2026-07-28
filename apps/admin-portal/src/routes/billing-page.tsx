import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { INVOICE_STATUSES, type InvoiceStatus } from '@itoby/shared'
import { Download, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { DataToolbar } from '@/components/data-toolbar'
import { KpiCard, KpiGrid } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { StatusTabs } from '@/components/status-tabs'
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
import { InvoiceDetailSheet } from '@/features/billing/invoice-detail-sheet'
import { InvoiceStatusBadge, invoiceStatusLabel } from '@/features/billing/status-badge'
import { useOwnerOptions } from '@/features/lookups/api'
import { useBuildings } from '@/features/units/api'
import { formatCurrency, formatDate } from '@/lib/format'

const ANY = '__any'
const NO_ROWS: BillingRow[] = []
const columnHelper = createColumnHelper<BillingRow>()

export function BillingPage() {
  const [filters, setFilters] = useState<BillingFilters>(EMPTY_BILLING_FILTERS)
  const [statusTab, setStatusTab] = useState<InvoiceStatus | 'ALL'>('ALL')
  const [detail, setDetail] = useState<BillingRow | null>(null)

  const buildings = useBuildings()
  const owners = useOwnerOptions()
  const report = useBillingReport({
    ...filters,
    status: statusTab === 'ALL' ? filters.status : statusTab,
  })

  const allForCounts = useBillingReport({
    buildingId: filters.buildingId,
    officeOwnerId: filters.officeOwnerId,
    status: null,
  })

  const rows = report.data ?? NO_ROWS
  const totals = useMemo(() => billingTotals(rows), [rows])

  const statusCounts = useMemo(() => {
    const source = allForCounts.data ?? NO_ROWS
    const counts: Record<InvoiceStatus | 'ALL', number> = {
      ALL: source.length,
      DUE: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      OVERDUE: 0,
    }
    for (const row of source) counts[row.status] += 1
    return counts
  }, [allForCounts.data])

  const collectedThisMonth = useMemo(() => {
    const source = allForCounts.data ?? NO_ROWS
    return source
      .filter((row) => row.status === 'PAID')
      .reduce((sum, row) => sum + row.total_amount, 0)
  }, [allForCounts.data])

  const columns = useMemo(
    () => [
      columnHelper.accessor('billing_cycle_key', { header: 'Cycle' }),
      columnHelper.accessor('owner_name', { header: 'Tenant' }),
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
          `${formatDate(row.original.billing_period_start)} – ${formatDate(
            row.original.billing_period_end,
          )}`,
      }),
      columnHelper.accessor('due_date', {
        header: 'Due',
        cell: (info) => <time dateTime={info.getValue()}>{formatDate(info.getValue())}</time>,
      }),
      columnHelper.accessor('total_amount', {
        header: () => <span className="block text-right">Amount (incl. GST)</span>,
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

  function patch(next: Partial<BillingFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  const filtered =
    Object.values(filters).some((value) => value !== null) || statusTab !== 'ALL'

  function exportCsv() {
    if (rows.length === 0) {
      toast.error('Nothing to export for the current filters.')
      return
    }
    const header = [
      'Cycle',
      'Tenant',
      'Unit',
      'Building',
      'Period start',
      'Period end',
      'Due',
      'Amount',
      'Status',
    ]
    const body = rows.map((row) =>
      [
        row.billing_cycle_key,
        row.owner_name,
        row.unit_code,
        row.building_name,
        row.billing_period_start,
        row.billing_period_end,
        row.due_date,
        row.total_amount,
        row.status,
      ]
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...body].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Billing CSV downloaded')
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoice history and outstanding dues across all tenants."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
            <Download aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Outstanding dues"
          value={formatCurrency(totals.outstandingTotal)}
          loading={report.isPending}
          icon={IndianRupee}
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(totals.overdueTotal)}
          loading={report.isPending}
        />
        <KpiCard
          label="Paid (filtered scope)"
          value={formatCurrency(collectedThisMonth)}
          loading={allForCounts.isPending}
        />
        <KpiCard
          label="Invoices"
          value={String(totals.invoiceCount)}
          loading={report.isPending}
        />
      </KpiGrid>

      <StatusTabs
        value={statusTab}
        onChange={setStatusTab}
        options={[
          { value: 'ALL', label: 'All', count: statusCounts.ALL },
          ...INVOICE_STATUSES.map((status) => ({
            value: status,
            label: invoiceStatusLabel(status),
            count: statusCounts[status],
          })),
        ]}
      />

      <DataToolbar
        clearable={filtered}
        onClear={() => {
          setFilters(EMPTY_BILLING_FILTERS)
          setStatusTab('ALL')
        }}
        filters={
          <>
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
              <Label htmlFor="filter-owner">Tenant</Label>
              <Select
                value={filters.officeOwnerId ?? ANY}
                onValueChange={(value) => patch({ officeOwnerId: value === ANY ? null : value })}
              >
                <SelectTrigger id="filter-owner" className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All tenants</SelectItem>
                  {(owners.data ?? []).map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

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
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => setDetail(row.original)}
              >
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

      <InvoiceDetailSheet invoice={detail} onClose={() => setDetail(null)} />
    </section>
  )
}
