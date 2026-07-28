import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { BillingReportRow } from '@itoby/shared'
import {
  AlertTriangle,
  Building2,
  Download,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  Users,
  Wrench,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '@/auth/use-auth'
import { KpiCard, KpiGrid } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuditLog, EMPTY_AUDIT_FILTERS } from '@/features/audit/api'
import { InvoiceStatusBadge } from '@/features/billing/status-badge'
import { ComplaintStatusBadge } from '@/features/complaints/status-badge'
import {
  EMPTY_COMPLAINT_FILTERS,
  useComplaints,
  type ComplaintRow,
} from '@/features/complaints/api'
import { ComplaintDetailDialog } from '@/features/complaints/complaint-detail-dialog'
import {
  dateRangeError,
  defaultDashboardFilters,
  useExportReport,
  useReportSnapshot,
  type DashboardFilters,
} from '@/features/reporting/api'
import { useBuildings } from '@/features/units/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { Uuid } from '@itoby/shared'

const ALL_BUILDINGS = '__all'
const numberFormat = new Intl.NumberFormat('en-IN')
const columnHelper = createColumnHelper<BillingReportRow>()
const NO_ROWS: BillingReportRow[] = []
const complaintColumnHelper = createColumnHelper<ComplaintRow>()

export function DashboardPage() {
  const { role, session } = useAuth()
  const isAdministrator = role === 'ADMINISTRATOR'

  if (!isAdministrator) {
    return <StaffDashboard userId={session?.user.id ?? null} />
  }

  return <AdminDashboard />
}

function AdminDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters)
  const rangeError = dateRangeError(filters)

  const buildings = useBuildings()
  const snapshot = useReportSnapshot(filters, rangeError === null)
  const exportReport = useExportReport()
  const recentAudit = useAuditLog({ ...EMPTY_AUDIT_FILTERS, offset: 0 })

  const rows = snapshot.data?.billingRows ?? NO_ROWS
  const occupancy = snapshot.data?.occupancy
  const revenue = snapshot.data?.revenue
  const loading = snapshot.isPending && snapshot.fetchStatus !== 'idle'
  const exportDisabled = rangeError !== null || exportReport.isPending

  const occupancyChart = useMemo(
    () => [
      { name: 'Occupied', value: occupancy?.occupiedCount ?? 0, fill: 'var(--chart-1)' },
      { name: 'Vacant', value: occupancy?.vacantCount ?? 0, fill: 'var(--chart-2)' },
    ],
    [occupancy],
  )

  const revenueChart = useMemo(
    () => [
      {
        name: 'Collected',
        amount: revenue?.totalRentCollected ?? 0,
      },
      {
        name: 'Outstanding',
        amount: revenue?.totalOutstandingDues ?? 0,
      },
    ],
    [revenue],
  )

  const columns = useMemo(
    () => [
      columnHelper.accessor('billingCycleKey', { header: 'Cycle' }),
      columnHelper.accessor('ownerName', { header: 'Tenant' }),
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

  const table = useReactTable({ data: rows.slice(0, 8), columns, getCoreRowModel: getCoreRowModel() })

  function patch(next: Partial<DashboardFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Occupancy, revenue, and recent activity for your rental portfolio."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/tenants">
                <Users aria-hidden="true" />
                New tenant
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/allotments">
                <Handshake aria-hidden="true" />
                New allotment
              </Link>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/billing">
                <AlertTriangle aria-hidden="true" />
                Overdue invoices
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dashboard-building">Building</Label>
          <Select
            value={filters.buildingId ?? ALL_BUILDINGS}
            onValueChange={(value) => patch({ buildingId: value === ALL_BUILDINGS ? null : value })}
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
          Current month
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

      <KpiGrid>
        <KpiCard
          label="Total units"
          value={numberFormat.format(occupancy?.totalUnits ?? 0)}
          icon={Building2}
          loading={loading}
        />
        <KpiCard
          label="Occupancy rate"
          value={`${occupancy?.occupancyRatePercent ?? 0}%`}
          subtitle={`${occupancy?.occupiedCount ?? 0} occupied · ${occupancy?.vacantCount ?? 0} vacant`}
          icon={LayoutDashboard}
          loading={loading}
        />
        <KpiCard
          label="Rent collected"
          value={formatCurrency(revenue?.totalRentCollected ?? 0)}
          icon={IndianRupee}
          loading={loading}
        />
        <KpiCard
          label="Outstanding dues"
          value={formatCurrency(revenue?.totalOutstandingDues ?? 0)}
          subtitle={`${revenue?.overdueInvoiceCount ?? 0} overdue invoices`}
          loading={loading}
        />
      </KpiGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="text-base">Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading ? (
              <Skeleton className="mx-auto h-52 w-52 rounded-full" />
            ) : (occupancy?.totalUnits ?? 0) === 0 ? (
              <p className="text-muted-foreground py-16 text-center text-sm">No units yet.</p>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {occupancyChart.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => numberFormat.format(Number(value ?? 0))}
                      contentStyle={{ borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-muted-foreground flex justify-center gap-4 text-xs">
                  <span>Occupied {occupancy?.occupiedCount ?? 0}</span>
                  <span>Vacant {occupancy?.vacantCount ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="px-4 pb-2">
            <CardTitle className="text-base">
              Revenue · {formatDate(revenue?.rangeStart ?? filters.startDate)} –{' '}
              {formatDate(revenue?.rangeEnd ?? filters.endDate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        value >= 100000 ? `${Math.round(value / 1000)}k` : String(value)
                      }
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                      contentStyle={{ borderRadius: 8 }}
                    />
                    <Bar dataKey="amount" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Invoices in range
            </h2>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/billing">View all</Link>
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2" aria-busy="true">
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
        </div>

        <Card className="py-4">
          <CardHeader className="px-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link to="/audit">Audit log</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4">
            {recentAudit.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : (recentAudit.data?.rows ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent audit entries.</p>
            ) : (
              <ul className="divide-y">
                {(recentAudit.data?.rows ?? []).slice(0, 5).map((entry) => (
                  <li key={entry.id} className="space-y-0.5 py-2.5 text-sm">
                    <p className="font-medium">{entry.action_type}</p>
                    <p className="text-muted-foreground truncate">
                      {entry.entity_type} · {entry.entity_id}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(entry.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function StaffDashboard({ userId }: { userId: string | null }) {
  const [selectedId, setSelectedId] = useState<Uuid | null>(null)
  const allComplaints = useComplaints(EMPTY_COMPLAINT_FILTERS)

  const mine = useMemo(
    () => (allComplaints.data ?? []).filter((row) => row.assigned_to === userId),
    [allComplaints.data, userId],
  )

  const openCount = useMemo(
    () =>
      (allComplaints.data ?? []).filter(
        (row) => row.status === 'OPEN' || row.status === 'ASSIGNED' || row.status === 'IN_PROGRESS',
      ).length,
    [allComplaints.data],
  )

  const assignedToMe = mine.filter((row) => row.status !== 'RESOLVED').length

  const resolvedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return mine.filter(
      (row) => row.status === 'RESOLVED' && new Date(row.updated_at).getTime() >= weekAgo,
    ).length
  }, [mine])

  const selected = (allComplaints.data ?? []).find((row) => row.id === selectedId) ?? null

  const columns = useMemo(
    () => [
      complaintColumnHelper.accessor('created_at', {
        header: 'Raised',
        cell: (info) => formatDateTime(info.getValue()),
      }),
      complaintColumnHelper.accessor('category', { header: 'Category' }),
      complaintColumnHelper.display({
        id: 'unit',
        header: 'Unit',
        cell: ({ row }) => `${row.original.unit_code} · ${row.original.building_name}`,
      }),
      complaintColumnHelper.accessor('owner_name', { header: 'Tenant' }),
      complaintColumnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <ComplaintStatusBadge status={info.getValue()} />,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: mine.filter((row) => row.status !== 'RESOLVED'),
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-6">
      <PageHeader
        title="Your work queue"
        description="Complaints assigned to you and open maintenance work."
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to="/complaints">
              <Wrench aria-hidden="true" />
              All complaints
            </Link>
          </Button>
        }
      />

      <KpiGrid className="xl:grid-cols-3">
        <KpiCard label="Open complaints" value={String(openCount)} loading={allComplaints.isPending} />
        <KpiCard
          label="Assigned to me"
          value={String(assignedToMe)}
          loading={allComplaints.isPending}
        />
        <KpiCard
          label="Resolved this week"
          value={String(resolvedThisWeek)}
          loading={allComplaints.isPending}
        />
      </KpiGrid>

      {allComplaints.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {allComplaints.error.message}
        </p>
      ) : null}

      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Assigned to you
      </h2>

      {allComplaints.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : table.getRowModel().rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wrench aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No open assignments</EmptyTitle>
            <EmptyDescription>
              When an administrator assigns a complaint to you, it appears here.
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
                onClick={() => setSelectedId(row.original.id)}
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

      <ComplaintDetailDialog
        complaint={selected}
        onClose={() => setSelectedId(null)}
      />
    </section>
  )
}
