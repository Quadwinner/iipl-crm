import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Building2, Plus } from 'lucide-react'
import { DataToolbar } from '@/components/data-toolbar'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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
  BuildingFormDialog,
  type BuildingFormTarget,
} from '@/features/buildings/building-form-dialog'
import { useBuildingList, type BuildingRow } from '@/features/buildings/api'
import { formatDateTime } from '@/lib/format'

const columnHelper = createColumnHelper<BuildingRow>()
const NO_ROWS: BuildingRow[] = []

export function BuildingsPage() {
  const buildings = useBuildingList()
  const [search, setSearch] = useState('')
  const [formTarget, setFormTarget] = useState<BuildingFormTarget | null>(null)

  const rows = useMemo(() => {
    const all = buildings.data ?? NO_ROWS
    const needle = search.trim().toLowerCase()
    if (!needle) return all
    return all.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) || row.address.toLowerCase().includes(needle),
    )
  }, [buildings.data, search])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Building',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('address', {
        header: 'Address',
        cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('unit_count', {
        header: () => <span className="block text-right">Units</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: (info) => (
          <span className="whitespace-nowrap">{formatDateTime(info.getValue())}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormTarget({ mode: 'edit', building: row.original })}
            >
              Edit
            </Button>
          </div>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <section className="space-y-6">
      <PageHeader
        title="Buildings"
        description="Properties that contain office units available for allotment."
        actions={
          <Button type="button" size="sm" onClick={() => setFormTarget({ mode: 'create' })}>
            <Plus aria-hidden="true" />
            New building
          </Button>
        }
      />

      <DataToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search buildings…"
        clearable={search.length > 0}
        onClear={() => setSearch('')}
      />

      {buildings.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {buildings.error.message}
        </p>
      ) : null}

      {buildings.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{search ? 'No matching buildings' : 'No buildings yet'}</EmptyTitle>
            <EmptyDescription>
              {search
                ? 'Try a different search term.'
                : 'Create a building before adding office units.'}
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

      <BuildingFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
    </section>
  )
}
