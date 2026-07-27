import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/use-auth'
import { formatTimestamp } from '@/lib/format'
import { useComplaintEvents, type ComplaintRow } from './api'
import { complaintStatusLabel, ComplaintStatusBadge } from './status-badge'

export function ComplaintDetailDialog({
  complaint,
  onClose,
}: {
  complaint: ComplaintRow | null
  onClose: () => void
}) {
  return (
    <Dialog open={complaint !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto sm:max-w-2xl">
        {complaint ? <ComplaintDetail complaint={complaint} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ComplaintDetail({ complaint }: { complaint: ComplaintRow }) {
  const { owner } = useAuth()
  const events = useComplaintEvents(complaint.id)

  return (
    <>
      <DialogHeader className="pb-4">
        <DialogTitle className="flex items-center gap-3 text-base">
          {complaint.category}
          <ComplaintStatusBadge status={complaint.status} />
        </DialogTitle>
        <DialogDescription>
          {complaint.unit_code} · {complaint.building_name}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid gap-x-6 gap-y-2 py-4 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-muted-foreground">Raised</dt>
        <dd>
          <time dateTime={complaint.created_at}>{formatTimestamp(complaint.created_at)}</time>
        </dd>
        <dt className="text-muted-foreground">Assigned to</dt>
        <dd>
          {complaint.assigned_to_name ?? (
            <span className="text-muted-foreground">Not yet assigned</span>
          )}
        </dd>
        <dt className="text-muted-foreground">Description</dt>
        <dd className="whitespace-pre-wrap">{complaint.description}</dd>
      </dl>

      <Separator />

      <section aria-labelledby="complaint-history" className="py-4">
        <h3 id="complaint-history" className="text-muted-foreground text-xs font-medium uppercase">
          Status history
        </h3>

        {events.isPending ? (
          <div className="space-y-2 pt-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : events.isError ? (
          <p role="alert" className="text-destructive pt-3 text-sm">
            {events.error.message}
          </p>
        ) : events.data?.length ? (
          <ol className="divide-border divide-y pt-1">
            {events.data.map((event) => (
              <li key={event.id} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
                <p className="text-muted-foreground text-xs">
                  <time dateTime={event.created_at}>{formatTimestamp(event.created_at)}</time>
                  {' · '}
                  {event.actor_user_id === null
                    ? 'System'
                    : event.actor_user_id === owner?.userId
                      ? 'You'
                      : (event.actor_name ?? 'IIPL staff')}
                </p>
                {event.event_type === 'STATUS_CHANGE' ? (
                  <p className="text-sm">
                    {event.old_status ? complaintStatusLabel(event.old_status) : 'Raised'} →{' '}
                    <span className="font-medium">
                      {event.new_status ? complaintStatusLabel(event.new_status) : 'unset'}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{event.comment_text}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground pt-3 text-sm">No status changes or comments yet.</p>
        )}
      </section>
    </>
  )
}
