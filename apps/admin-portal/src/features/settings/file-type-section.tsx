import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@itoby/ui'
import { useFileStorageConfig, type FileStorageConfigRow } from './api'
import { FileTypeDialog, type FileTypeTarget } from './file-type-dialog'
import { SettingsSection } from './fields'

const columnHelper = createColumnHelper<FileStorageConfigRow>()
const NO_ROWS: FileStorageConfigRow[] = []

export function FileTypeSection() {
  const [target, setTarget] = useState<FileTypeTarget | null>(null)
  const fileTypes = useFileStorageConfig()
  const rows = fileTypes.data ?? NO_ROWS

  const columns = useMemo(
    () => [
      columnHelper.accessor('file_extension', {
        header: 'Extension',
        cell: (info) => <span className="font-mono">.{info.getValue()}</span>,
      }),
      columnHelper.accessor('mime_type', {
        header: 'MIME type',
        cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('file_type_accepted', {
        header: 'Status',
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="secondary">Accepted</Badge>
          ) : (
            <Badge variant="outline">Not accepted</Badge>
          ),
      }),
      columnHelper.accessor('max_file_size_mb', {
        header: () => <span className="block text-right">Max size</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">{info.getValue()} MB</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTarget({ mode: 'edit', row: row.original })}
          >
            Edit
          </Button>
        ),
      }),
    ],
    [],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <SettingsSection
      title="Uploads"
      description="Accepted file types and the maximum file size allowed for each."
    >
      {fileTypes.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : fileTypes.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {fileTypes.error.message}
        </p>
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
                  <TableCell key={cell.id} className="py-1.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setTarget({ mode: 'create' })}
      >
        Add file type
      </Button>

      <FileTypeDialog target={target} onClose={() => setTarget(null)} />
    </SettingsSection>
  )
}
