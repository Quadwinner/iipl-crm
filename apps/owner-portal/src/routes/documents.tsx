import { FolderOpen } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
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
import { useAuth } from '@/auth/use-auth'
import {
  useDownloadOwnerDocument,
  useOwnerDocuments,
  type OwnerDocumentRow,
} from '@/features/documents/api'
import { formatDate, formatFileSize } from '@/lib/format'

const NO_ROWS: OwnerDocumentRow[] = []

export function DocumentsScreen() {
  const { owner } = useAuth()
  const documents = useOwnerDocuments(owner?.ownerId ?? '')
  const download = useDownloadOwnerDocument()

  const rows = documents.data ?? NO_ROWS

  return (
    <section className="space-y-6">
      <PageHeader
        title="Your documents"
        description="Documents linked to your lease or account. Downloads open through a short-lived link."
      />

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
        <Empty className="surface-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No documents</EmptyTitle>
            <EmptyDescription>
              Lease agreements and account documents shared with you appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Linked to</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.file_name}</TableCell>
                <TableCell>
                  {row.lease_id ? (
                    <span>
                      <Badge variant="secondary" className="font-normal">
                        Lease
                      </Badge>
                      <span className="text-muted-foreground">
                        {row.unit_code ? ` ${row.unit_code} ·` : ''} {formatDate(row.lease_start)} –{' '}
                        {formatDate(row.lease_end)}
                      </span>
                    </span>
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      Account
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatFileSize(row.size_bytes)}
                </TableCell>
                <TableCell>
                  <time dateTime={row.created_at}>{formatDate(row.created_at.slice(0, 10))}</time>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={download.isPending}
                    onClick={() => download.mutate(row.id)}
                    aria-label={`Download ${row.file_name}`}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </section>
  )
}
