import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  PAYMENT_GATEWAYS,
  PAYMENT_STATUSES,
  type GatewayType,
  type PaymentStatus,
  type Uuid,
} from '@itoby/shared'
import { CreditCard } from 'lucide-react'
import { DataToolbar } from '@rental-admin/components/data-toolbar'
import { KpiCard, KpiGrid } from '@rental-admin/components/kpi-card'
import { PageHeader } from '@rental-admin/components/page-header'
import { Badge } from '@rental-admin/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@rental-admin/components/ui/empty'
import { Input } from '@rental-admin/components/ui/input'
import { Label } from '@rental-admin/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rental-admin/components/ui/select'
import { Skeleton } from '@rental-admin/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rental-admin/components/ui/table'
import { useOwnerOptions } from '@rental-admin/features/lookups/api'
import { useAllPayments, type LedgerPaymentRow } from '@rental-admin/features/tenants/api'
import { formatCurrency, formatDateTime } from '@rental-admin/lib/format'

const ANY = '__any'
const NO_ROWS: LedgerPaymentRow[] = []
const columnHelper = createColumnHelper<LedgerPaymentRow>()

interface PaymentFilters {
  gateway: GatewayType | null
  status: PaymentStatus | null
  ownerId: Uuid | null
  from: string
  to: string
  search: string
}

const EMPTY_FILTERS: PaymentFilters = {
  gateway: null,
  status: null,
  ownerId: null,
  from: '',
  to: '',
  search: '',
}

export function PaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>(EMPTY_FILTERS)
  const payments = useAllPayments()
  const owners = useOwnerOptions()

  const rows = useMemo(() => {
    const all = payments.data ?? NO_ROWS
    const needle = filters.search.trim().toLowerCase()
    return all.filter((row) => {
      if (filters.gateway && row.gateway !== filters.gateway) return false
      if (filters.status && row.status !== filters.status) return false
      if (filters.ownerId && row.office_owner_id !== filters.ownerId) return false
      const day = (row.completed_at ?? row.created_at).slice(0, 10)
      if (filters.from && day < filters.from) return false
      if (filters.to && day > filters.to) return false
      if (!needle) return true
      return (
        row.owner_name.toLowerCase().includes(needle) ||
        (row.transaction_ref ?? '').toLowerCase().includes(needle) ||
        (row.billing_cycle_key ?? '').toLowerCase().includes(needle) ||
        (row.unit_code ?? '').toLowerCase().includes(needle)
      )
    })
  }, [payments.data, filters])

  const kpis = useMemo(() => {
    const completed = rows.filter((row) => row.status === 'COMPLETED')
    return {
      count: rows.length,
      completed: completed.length,
      total: completed.reduce((sum, row) => sum + row.amount, 0),
      failed: rows.filter((row) => row.status === 'FAILED' || row.status === 'CANCELLED').length,
    }
  }, [rows])

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.completed_at ?? row.created_at, {
        id: 'date',
        header: 'Date',
        cell: (info) => (
          <span className="whitespace-nowrap">{formatDateTime(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('owner_name', {
        header: 'Tenant',
        cell: (info) => (
          <Link
            to={`/app/rental/tenants/${info.row.original.office_owner_id}`}
            className="font-medium underline-offset-4 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('unit_code', {
        header: 'Unit',
        cell: (info) => info.getValue() ?? '—',
      }),
      columnHelper.accessor('billing_cycle_key', {
        header: 'Cycle',
        cell: (info) => info.getValue() ?? '—',
      }),
      columnHelper.accessor('gateway', { header: 'Gateway' }),
      columnHelper.accessor('amount', {
        header: () => <span className="block text-right">Amount</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() === 'COMPLETED' ? 'secondary' : 'outline'}>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('transaction_ref', {
        header: 'Reference',
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue() ?? '—'}</span>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })
  const filtered = Object.entries(filters).some(([key, value]) =>
    key === 'search' || key === 'from' || key === 'to' ? Boolean(value) : value !== null,
  )

  function patch(next: Partial<PaymentFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Payments"
        description="Gateway payment ledger across all tenants and invoices."
      />

      <KpiGrid>
        <KpiCard label="Shown" value={String(kpis.count)} icon={CreditCard} loading={payments.isPending} />
        <KpiCard label="Completed" value={String(kpis.completed)} loading={payments.isPending} />
        <KpiCard
          label="Collected"
          value={formatCurrency(kpis.total)}
          loading={payments.isPending}
        />
        <KpiCard label="Failed / cancelled" value={String(kpis.failed)} loading={payments.isPending} />
      </KpiGrid>

      <DataToolbar
        search={filters.search}
        onSearchChange={(search) => patch({ search })}
        searchPlaceholder="Search tenant, unit, ref…"
        clearable={filtered}
        onClear={() => setFilters(EMPTY_FILTERS)}
        filters={
          <>
            <div className="space-y-1.5">
              <Label htmlFor="pay-tenant">Tenant</Label>
              <Select
                value={filters.ownerId ?? ANY}
                onValueChange={(value) => patch({ ownerId: value === ANY ? null : value })}
              >
                <SelectTrigger id="pay-tenant" className="w-48">
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
            <div className="space-y-1.5">
              <Label htmlFor="pay-gateway">Gateway</Label>
              <Select
                value={filters.gateway ?? ANY}
                onValueChange={(value) =>
                  patch({ gateway: value === ANY ? null : (value as GatewayType) })
                }
              >
                <SelectTrigger id="pay-gateway" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All gateways</SelectItem>
                  {PAYMENT_GATEWAYS.map((gateway) => (
                    <SelectItem key={gateway} value={gateway}>
                      {gateway}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-status">Status</Label>
              <Select
                value={filters.status ?? ANY}
                onValueChange={(value) =>
                  patch({ status: value === ANY ? null : (value as PaymentStatus) })
                }
              >
                <SelectTrigger id="pay-status" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All statuses</SelectItem>
                  {PAYMENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-from">From</Label>
              <Input
                id="pay-from"
                type="date"
                className="w-40"
                value={filters.from}
                onChange={(event) => patch({ from: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-to">To</Label>
              <Input
                id="pay-to"
                type="date"
                className="w-40"
                value={filters.to}
                onChange={(event) => patch({ to: event.target.value })}
              />
            </div>
          </>
        }
      />

      {payments.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {payments.error.message}
        </p>
      ) : null}

      {payments.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCard aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No payments</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? 'No payments match the current filters.'
                : 'Completed and attempted payments appear here.'}
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
