import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
  type ExpenseCategory,
} from '@itoby/shared'
import { Plus, Wallet } from 'lucide-react'
import { DataToolbar } from '@/components/data-toolbar'
import { KpiCard, KpiGrid } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
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
  EMPTY_EXPENSE_FILTERS,
  expenseTotals,
  useExpenseList,
  type ExpenseFilters,
  type ExpenseRow,
} from '@/features/expenses/api'
import {
  ExpenseFormDialog,
  type ExpenseFormTarget,
} from '@/features/expenses/expense-form-dialog'
import { useBuildings } from '@/features/units/api'
import { formatCurrency, formatDate } from '@/lib/format'

const ANY = '__any'
const NO_ROWS: ExpenseRow[] = []
const columnHelper = createColumnHelper<ExpenseRow>()

export function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>(EMPTY_EXPENSE_FILTERS)
  const [search, setSearch] = useState('')
  const [formTarget, setFormTarget] = useState<ExpenseFormTarget | null>(null)

  const buildings = useBuildings()
  const expenses = useExpenseList(filters)

  const rows = useMemo(() => {
    const all = expenses.data ?? NO_ROWS
    const needle = search.trim().toLowerCase()
    if (!needle) return all
    return all.filter(
      (row) =>
        row.title.toLowerCase().includes(needle) ||
        row.building_name.toLowerCase().includes(needle) ||
        expenseCategoryLabel(row.category).toLowerCase().includes(needle) ||
        (row.vendor_name ?? '').toLowerCase().includes(needle) ||
        (row.reference_note ?? '').toLowerCase().includes(needle),
    )
  }, [expenses.data, search])

  const totals = useMemo(() => expenseTotals(rows), [rows])

  const columns = useMemo(
    () => [
      columnHelper.accessor('expense_date', {
        header: 'Date',
        cell: (info) => <time dateTime={info.getValue()}>{formatDate(info.getValue())}</time>,
      }),
      columnHelper.accessor('building_name', {
        header: 'Building',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: (info) => (
          <Badge variant="secondary" className="font-normal">
            {expenseCategoryLabel(info.getValue())}
          </Badge>
        ),
      }),
      columnHelper.accessor('title', { header: 'Title' }),
      columnHelper.accessor('vendor_name', {
        header: 'Paid to',
        cell: (info) => info.getValue() ?? '—',
      }),
      columnHelper.accessor('amount', {
        header: () => <span className="block text-right">Amount</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {formatCurrency(Number(info.getValue()))}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormTarget({ mode: 'edit', expense: row.original })}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormTarget({ mode: 'delete', expense: row.original })}
            >
              Delete
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  function patch(next: Partial<ExpenseFilters>) {
    setFilters((current) => ({ ...current, ...next }))
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Building expenses"
        description="Record operational spending — cleaning, guard salary, diesel, repairs, and other building costs."
        actions={
          <Button type="button" size="sm" onClick={() => setFormTarget({ mode: 'create' })}>
            <Plus aria-hidden="true" />
            Add expense
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Expenses in view"
          value={String(totals.count)}
          icon={Wallet}
          loading={expenses.isPending}
        />
        <KpiCard
          label="Total spent"
          value={formatCurrency(totals.total)}
          loading={expenses.isPending}
        />
      </KpiGrid>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expense-filter-building">Building</Label>
          <Select
            value={filters.buildingId ?? ANY}
            onValueChange={(value) => patch({ buildingId: value === ANY ? null : value })}
          >
            <SelectTrigger id="expense-filter-building" className="w-48">
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
          <Label htmlFor="expense-filter-category">Category</Label>
          <Select
            value={filters.category ?? ANY}
            onValueChange={(value) =>
              patch({ category: value === ANY ? null : (value as ExpenseCategory) })
            }
          >
            <SelectTrigger id="expense-filter-category" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {expenseCategoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expense-filter-from">From</Label>
          <Input
            id="expense-filter-from"
            type="date"
            className="w-40"
            value={filters.startDate}
            onChange={(event) => patch({ startDate: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expense-filter-to">To</Label>
          <Input
            id="expense-filter-to"
            type="date"
            className="w-40"
            value={filters.endDate}
            onChange={(event) => patch({ endDate: event.target.value })}
          />
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={() => setFilters(EMPTY_EXPENSE_FILTERS)}>
          Clear filters
        </Button>
      </div>

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, vendor, building…"
        clearable={search.length > 0}
        onClear={() => setSearch('')}
      />

      {expenses.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {expenses.error.message}
        </p>
      ) : null}

      {expenses.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Empty className="surface-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No expenses yet</EmptyTitle>
            <EmptyDescription>
              Record cleaning, guard salary, diesel, and other building costs to track spending
              over time.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="surface-card overflow-hidden">
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
        </div>
      )}

      <ExpenseFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
    </section>
  )
}
