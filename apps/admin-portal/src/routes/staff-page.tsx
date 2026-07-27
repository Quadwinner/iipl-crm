import { useCallback, useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { useSetStaffActive, useStaff, type StaffRow } from '@/features/staff/api'
import { CreateStaffDialog } from '@/features/staff/create-staff-dialog'
import { DeactivateStaffDialog } from '@/features/staff/deactivate-staff-dialog'
import { mapDbError } from '@/lib/db-error'
import { formatDateTime } from '@/lib/format'

export function StaffPage() {
  const [pendingDeactivation, setPendingDeactivation] = useState<StaffRow | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const staff = useStaff()
  const setActive = useSetStaffActive()

  const reactivate = useCallback(
    async (row: StaffRow) => {
      setActionError(null)
      try {
        await setActive.mutateAsync({ userId: row.user_id, active: true })
        toast.success('Staff member reactivated')
      } catch (cause) {
        setActionError(mapDbError(cause).message)
      }
    },
    [setActive],
  )

  const columns = useMemo(() => {
    const column = createColumnHelper<StaffRow>()
    return [
      column.accessor('full_name', {
        header: 'Name',
        cell: (info) => <span className="font-medium">{info.getValue() ?? '—'}</span>,
      }),
      column.accessor('email', { header: 'Email' }),
      column.accessor('phone', { header: 'Phone', cell: (info) => info.getValue() ?? '—' }),
      column.accessor('is_active', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'default' : 'secondary'}>
            {info.getValue() ? 'Active' : 'Deactivated'}
          </Badge>
        ),
      }),
      column.accessor('created_at', {
        header: 'Created',
        cell: (info) => (
          <span className="whitespace-nowrap">{formatDateTime(info.getValue())}</span>
        ),
      }),
      column.display({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1 whitespace-nowrap">
            {row.original.is_active ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPendingDeactivation(row.original)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={setActive.isPending}
                onClick={() => void reactivate(row.original)}
              >
                Reactivate
              </Button>
            )}
          </div>
        ),
      }),
    ]
  }, [reactivate, setActive.isPending])

  const table = useReactTable({
    data: staff.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Maintenance staff</h1>
          <p className="text-muted-foreground text-sm">
            Staff accounts that can be assigned maintenance complaints.
          </p>
        </div>
        <CreateStaffDialog />
      </div>

      <Separator />

      {staff.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {staff.error.message}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="text-destructive text-sm">
          {actionError}
        </p>
      ) : null}

      {staff.isPending ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground">
                  No maintenance staff accounts yet.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <DeactivateStaffDialog
        staff={pendingDeactivation}
        onClose={() => setPendingDeactivation(null)}
      />
    </section>
  )
}
