import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { OWNER_STATUSES, type OwnerStatus } from '@itoby/shared'
import { Users } from 'lucide-react'
import { DataToolbar } from '@rental-admin/components/data-toolbar'
import { KpiCard, KpiGrid } from '@rental-admin/components/kpi-card'
import { PageHeader } from '@rental-admin/components/page-header'
import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@itoby/ui'
import { Label } from '@itoby/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@itoby/ui'
import { CreateOwnerDialog } from '@rental-admin/features/owners/create-owner-dialog'
import { DeactivateOwnerDialog } from '@rental-admin/features/owners/deactivate-owner-dialog'
import { useEnrichedTenants, type TenantListRow } from '@rental-admin/features/tenants/api'
import { formatCurrency, formatDateTime } from '@rental-admin/lib/format'

const ALL = 'ALL'

const STATUS_LABELS: Record<OwnerStatus, string> = {
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
}

const columnHelper = createColumnHelper<TenantListRow>()
const NO_ROWS: TenantListRow[] = []

export function OwnersPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<OwnerStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [pendingDeactivation, setPendingDeactivation] = useState<TenantListRow | null>(null)

  const tenants = useEnrichedTenants()

  const filtered = useMemo(() => {
    const all = tenants.data ?? NO_ROWS
    const needle = search.trim().toLowerCase()
    return all.filter((row) => {
      if (status !== 'ALL' && row.status !== status) return false
      if (!needle) return true
      return (
        row.name.toLowerCase().includes(needle) ||
        row.contact_email.toLowerCase().includes(needle) ||
        row.phone.includes(needle)
      )
    })
  }, [tenants.data, status, search])

  const kpis = useMemo(() => {
    const all = tenants.data ?? NO_ROWS
    return {
      total: all.length,
      active: all.filter((row) => row.status === 'ACTIVE').length,
      deactivated: all.filter((row) => row.status === 'DEACTIVATED').length,
      outstanding: all.reduce((sum, row) => sum + row.outstanding_balance, 0),
    }
  }, [tenants.data])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Tenant',
        cell: (info) => (
          <div className="space-y-0.5">
            <p className="font-medium">{info.getValue()}</p>
            <p className="text-muted-foreground text-xs">{info.row.original.contact_email}</p>
          </div>
        ),
      }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('active_units', {
        header: 'Active units',
        cell: (info) => {
          const units = info.getValue()
          if (units.length === 0) {
            return <span className="text-muted-foreground">None</span>
          }
          return (
            <div className="space-y-0.5 text-sm">
              {units.slice(0, 2).map((unit) => (
                <p key={unit} className="truncate">
                  {unit}
                </p>
              ))}
              {units.length > 2 ? (
                <p className="text-muted-foreground text-xs">+{units.length - 2} more</p>
              ) : null}
            </div>
          )
        },
      }),
      columnHelper.accessor('outstanding_balance', {
        header: () => <span className="block text-right">Outstanding</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('last_payment_at', {
        header: 'Last payment',
        cell: (info) => (
          <span className="whitespace-nowrap text-sm">
            {info.getValue() ? formatDateTime(info.getValue()) : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() === 'ACTIVE' ? 'default' : 'secondary'}>
            {STATUS_LABELS[info.getValue()]}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1 whitespace-nowrap">
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to={`/app/rental/tenants/${row.original.id}`} onClick={(e) => e.stopPropagation()}>
                Open
              </Link>
            </Button>
            {row.original.status === 'ACTIVE' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  setPendingDeactivation(row.original)
                }}
              >
                Deactivate
              </Button>
            ) : null}
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Office owner accounts, active leases, and outstanding balances."
        actions={<CreateOwnerDialog />}
      />

      <KpiGrid>
        <KpiCard label="Total tenants" value={String(kpis.total)} icon={Users} loading={tenants.isPending} />
        <KpiCard label="Active" value={String(kpis.active)} loading={tenants.isPending} />
        <KpiCard label="Deactivated" value={String(kpis.deactivated)} loading={tenants.isPending} />
        <KpiCard
          label="Outstanding"
          value={formatCurrency(kpis.outstanding)}
          loading={tenants.isPending}
        />
      </KpiGrid>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone…"
        clearable={search.length > 0 || status !== 'ALL'}
        onClear={() => {
          setSearch('')
          setStatus('ALL')
        }}
        filters={
          <div className="space-y-1.5">
            <Label htmlFor="tenant-status-filter">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as OwnerStatus | 'ALL')}
            >
              <SelectTrigger id="tenant-status-filter" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {OWNER_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {STATUS_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {tenants.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {tenants.error?.message}
        </p>
      ) : null}

      {tenants.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No tenants match</EmptyTitle>
            <EmptyDescription>
              Adjust filters or create a new tenant account to get started.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/app/rental/tenants/${row.original.id}`)}
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

      <DeactivateOwnerDialog
        owner={pendingDeactivation}
        onClose={() => setPendingDeactivation(null)}
      />
    </section>
  )
}
