import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@rental-admin/components/ui/badge'
import { Button } from '@rental-admin/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rental-admin/components/ui/table'
import { OCCUPANCY_LABELS, currencyFormat, sizeFormat } from './labels'
import type { UnitRow } from './api'

interface UnitsTableProps {
  units: UnitRow[]
  canEdit: boolean
  onEdit: (unit: UnitRow) => void
}

const column = createColumnHelper<UnitRow>()

export function UnitsTable({ units, canEdit, onEdit }: UnitsTableProps) {
  const columns = useMemo(
    () => [
      column.accessor('unit_code', {
        header: 'Unit code',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      column.accessor('building_name', { header: 'Building' }),
      column.accessor('floor', {
        header: () => <span className="block text-right">Floor</span>,
        cell: (info) => <span className="block text-right tabular-nums">{info.getValue()}</span>,
      }),
      column.accessor('size_sqft', {
        header: () => <span className="block text-right">Size (sq ft)</span>,
        cell: (info) => (
          <span className="block text-right tabular-nums">
            {sizeFormat.format(info.getValue())}
          </span>
        ),
      }),
      column.accessor('base_rent_amount', {
        header: () => <span className="block text-right">Base rent</span>,
        cell: (info) => (
          <span className="block text-right tabular-nums">
            {currencyFormat.format(info.getValue())}
          </span>
        ),
      }),
      column.accessor('occupancy_status', {
        header: 'Occupancy',
        cell: (info) => (
          <Badge variant={info.getValue() === 'OCCUPIED' ? 'default' : 'outline'}>
            {OCCUPANCY_LABELS[info.getValue()]}
          </Badge>
        ),
      }),
      column.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: (info) =>
          canEdit ? (
            <div className="text-right">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(info.row.original)}
              >
                Edit
                <span className="sr-only"> unit {info.row.original.unit_code}</span>
              </Button>
            </div>
          ) : null,
      }),
    ],
    [canEdit, onEdit],
  )

  const table = useReactTable({ data: units, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="text-muted-foreground text-xs font-medium">
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
  )
}
