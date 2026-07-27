import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { Uuid } from '@itoby/shared'
import { FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
  formatMegabytes,
  useDocuments,
  useDownloadDocument,
  type DocumentRow,
} from '@/features/documents/api'
import { UploadDocumentDialog } from '@/features/documents/upload-document-dialog'
import { useOwnerOptions } from '@/features/lookups/api'
import { formatDate } from '@/lib/format'

const ALL_OWNERS = '__all'

const columnHelper = createColumnHelper<DocumentRow>()
const NO_ROWS: DocumentRow[] = []

export function DocumentsPage() {
  const [ownerId, setOwnerId] = useState<Uuid | null>(null)

  const owners = useOwnerOptions()
  const documents = useDocuments(ownerId)
  const download = useDownloadDocument()

  const rows = documents.data ?? NO_ROWS

  const columns = useMemo(
    () => [
      columnHelper.accessor('file_name', {
        header: 'Document',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor('owner_name', { header: 'Office owner' }),
      columnHelper.display({
        id: 'link',
        header: 'Linked to',
        cell: ({ row }) =>
          row.original.lease_id ? (
            <span>
              <Badge variant="secondary">Lease</Badge>
              <span className="text-muted-foreground">
                {' '}
                {formatDate(row.original.lease_start)} – {formatDate(row.original.lease_end)}
              </span>
            </span>
          ) : (
            <Badge variant="outline">Owner</Badge>
          ),
      }),
      columnHelper.accessor('size_bytes', {
        header: () => <span className="block text-right">Size</span>,
        cell: (info) => (
          <span className="block text-right font-mono tabular-nums">
            {formatMegabytes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Uploaded',
        cell: (info) => (
          <time dateTime={info.getValue()}>{formatDate(info.getValue().slice(0, 10))}</time>
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
            disabled={download.isPending}
            onClick={() => download.mutate(row.original.id)}
          >
            View
          </Button>
        ),
      }),
    ],
    [download],
  )

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">
            Lease and owner documents. Downloads open through a short-lived signed link.
          </p>
        </div>
        <UploadDocumentDialog />
      </div>

      <Separator />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-document-owner">Office owner</Label>
          <Select
            value={ownerId ?? ALL_OWNERS}
            onValueChange={(value) => setOwnerId(value === ALL_OWNERS ? null : value)}
          >
            <SelectTrigger id="filter-document-owner" className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_OWNERS}>All owners</SelectItem>
              {(owners.data ?? []).map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {ownerId !== null ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOwnerId(null)}>
            Clear filter
          </Button>
        ) : null}
      </div>

      {owners.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {owners.error.message}
        </p>
      ) : null}
      {download.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {download.error.message}
        </p>
      ) : null}

      {documents.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : documents.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {documents.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No documents</EmptyTitle>
            <EmptyDescription>
              {ownerId
                ? 'This owner has no documents yet.'
                : 'Upload a lease agreement or owner record to get started.'}
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
