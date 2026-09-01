import { Link } from 'react-router-dom'
import { Bell, IndianRupee } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import {
  reminderAmount,
  reminderTitle,
  useOwnerReminders,
} from '@/features/notifications/api'
import { formatCurrency, formatDate, formatTimestamp } from '@/lib/format'

export function RemindersScreen() {
  const reminders = useOwnerReminders()

  return (
    <section className="space-y-6">
      <PageHeader
        title="Reminders"
        description="Bill reminders shared by IIPL or sent automatically before and after the due date."
      />

      {reminders.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : reminders.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {reminders.error.message}
        </p>
      ) : (reminders.data ?? []).length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bell aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No reminders yet</EmptyTitle>
            <EmptyDescription>
              When a bill reminder is shared with you, it will show up here with the amount and due
              date.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {(reminders.data ?? []).map((row) => {
            const amount = reminderAmount(row)
            const overdue = row.notification_type === 'REMINDER_OVERDUE'
            return (
              <li key={row.id} className="surface-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{reminderTitle(row)}</p>
                      <Badge variant={overdue ? 'destructive' : 'secondary'}>
                        {overdue ? 'Overdue' : 'Upcoming'}
                      </Badge>
                      {row.payload.manual ? (
                        <Badge variant="outline">From admin</Badge>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {amount != null ? (
                        <>
                          Amount due{' '}
                          <span className="text-foreground font-mono font-medium tabular-nums">
                            {formatCurrency(amount)}
                          </span>
                        </>
                      ) : (
                        'Payment reminder'
                      )}
                      {row.payload.due_date ? (
                        <> · Due {formatDate(row.payload.due_date)}</>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Received {formatTimestamp(row.created_at)}
                    </p>
                  </div>
                  <Button type="button" size="sm" asChild>
                    <Link to="/invoices">
                      <IndianRupee aria-hidden="true" />
                      View invoices
                    </Link>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
