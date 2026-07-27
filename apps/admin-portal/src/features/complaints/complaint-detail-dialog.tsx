import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  COMPLAINT_TEXT_MAX,
  COMPLAINT_UPDATABLE_STATUSES,
  complaintCommentSchema,
  type ComplaintCommentInput,
  type ComplaintUpdatableStatus,
  type Uuid,
} from '@itoby/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/auth/use-auth'
import { mapDbError } from '@/lib/db-error'
import {
  useAddComplaintComment,
  useAssignComplaint,
  useComplaintEvents,
  useMaintenanceStaff,
  useUpdateComplaintStatus,
  type ComplaintRow,
} from './api'
import { complaintStatusLabel, ComplaintStatusBadge } from './status-badge'

const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_LABELS: Record<ComplaintUpdatableStatus, string> = {
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
}

interface ComplaintDetailDialogProps {
  complaint: ComplaintRow | null
  onClose: () => void
}

export function ComplaintDetailDialog({ complaint, onClose }: ComplaintDetailDialogProps) {
  return (
    <Dialog open={complaint !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto sm:max-w-2xl">
        {complaint ? <ComplaintDetail complaint={complaint} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ComplaintDetail({ complaint }: { complaint: ComplaintRow }) {
  const { role, session } = useAuth()
  const userId = session?.user.id ?? null
  const isAdministrator = role === 'ADMINISTRATOR'
  const assignedTo: Uuid | null = complaint.assigned_to ?? null
  const isAssignee = assignedTo !== null && assignedTo === userId
  const canUpdateStatus = isAdministrator || isAssignee

  const events = useComplaintEvents(complaint.id)
  const staff = useMaintenanceStaff(isAdministrator)
  const assigneeName =
    assignedTo === null
      ? null
      : (staff.data?.find((member) => member.user_id === assignedTo)?.name ?? null)

  return (
    <>
      <DialogHeader className="pb-4">
        <DialogTitle className="flex items-center gap-3 text-base">
          {complaint.category}
          <ComplaintStatusBadge status={complaint.status} />
        </DialogTitle>
        <DialogDescription>
          {complaint.unit_code} · {complaint.building_name} · {complaint.owner_name}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid gap-x-6 gap-y-2 py-4 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-muted-foreground">Raised</dt>
        <dd>
          <time dateTime={complaint.created_at}>
            {dateTimeFormat.format(new Date(complaint.created_at))}
          </time>
        </dd>
        <dt className="text-muted-foreground">Assigned to</dt>
        <dd>
          {assigneeName !== null ? (
            <span>{assigneeName}</span>
          ) : (
            <ActorLabel actorId={assignedTo} userId={userId} unassignedLabel="Unassigned" />
          )}
        </dd>
        <dt className="text-muted-foreground">Description</dt>
        <dd className="whitespace-pre-wrap">{complaint.description}</dd>
      </dl>

      <Separator />

      <section aria-labelledby="complaint-history" className="py-4">
        <h3 id="complaint-history" className="text-muted-foreground text-xs font-medium uppercase">
          History
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
              <li key={event.id} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                <p className="text-muted-foreground text-xs">
                  <time dateTime={event.created_at}>
                    {dateTimeFormat.format(new Date(event.created_at))}
                  </time>
                  {' · '}
                  <ActorLabel actorId={event.actor_user_id} userId={userId} />
                </p>
                {event.event_type === 'STATUS_CHANGE' ? (
                  <p className="text-sm">
                    Status {event.old_status ? complaintStatusLabel(event.old_status) : 'unset'} →{' '}
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

      <Separator />

      <div className="space-y-6 pt-4">
        <AssignSection complaint={complaint} isAdministrator={isAdministrator} />
        <StatusSection complaint={complaint} canUpdateStatus={canUpdateStatus} />
        <CommentSection complaintId={complaint.id} />
      </div>
    </>
  )
}

function ActorLabel({
  actorId,
  userId,
  unassignedLabel = 'System',
}: {
  actorId: string | null
  userId: string | null
  unassignedLabel?: string
}) {
  if (!actorId) return <span className="text-muted-foreground">{unassignedLabel}</span>
  if (actorId === userId) return <span>You</span>
  return (
    <span className="font-mono text-xs" title={actorId}>
      {actorId.slice(0, 8)}
    </span>
  )
}

function AssignSection({
  complaint,
  isAdministrator,
}: {
  complaint: ComplaintRow
  isAdministrator: boolean
}) {
  const resolved = complaint.status === 'RESOLVED'
  const blocked = !isAdministrator || resolved

  const staff = useMaintenanceStaff(!blocked)
  const assign = useAssignComplaint()
  const [staffId, setStaffId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  async function onAssign() {
    setError(null)
    try {
      await assign.mutateAsync({ complaintId: complaint.id, staffId })
      setStaffId('')
    } catch (cause) {
      setError(mapDbError(cause).message)
    }
  }

  return (
    <section aria-labelledby="assign-heading" className="space-y-2">
      <h3 id="assign-heading" className="text-muted-foreground text-xs font-medium uppercase">
        Assign
      </h3>

      {blocked ? (
        <p className="text-muted-foreground text-sm">
          {resolved
            ? 'A resolved complaint cannot be assigned.'
            : 'Only an administrator can assign complaints.'}
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="assign-staff">Maintenance staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="assign-staff" className="w-72">
                <SelectValue placeholder="Select a staff member" />
              </SelectTrigger>
              <SelectContent>
                {(staff.data ?? []).map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={staffId === '' || assign.isPending}
            onClick={() => void onAssign()}
          >
            {assign.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      )}

      {staff.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {staff.error.message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function StatusSection({
  complaint,
  canUpdateStatus,
}: {
  complaint: ComplaintRow
  canUpdateStatus: boolean
}) {
  const update = useUpdateComplaintStatus()
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  async function onUpdate() {
    setError(null)
    try {
      await update.mutateAsync({
        complaintId: complaint.id,
        status: status as ComplaintUpdatableStatus,
      })
      setStatus('')
    } catch (cause) {
      setError(mapDbError(cause).message)
    }
  }

  return (
    <section aria-labelledby="status-heading" className="space-y-2">
      <h3 id="status-heading" className="text-muted-foreground text-xs font-medium uppercase">
        Update status
      </h3>

      {canUpdateStatus ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-status">New status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="new-status" className="w-48">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_UPDATABLE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={status === '' || update.isPending}
            onClick={() => void onUpdate()}
          >
            {update.isPending ? 'Saving…' : 'Save status'}
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Only the assigned staff member or an administrator can change this status.
        </p>
      )}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </section>
  )
}

function CommentSection({ complaintId }: { complaintId: Uuid }) {
  const addComment = useAddComplaintComment()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintCommentInput>({
    resolver: zodResolver(complaintCommentSchema),
    defaultValues: { comment: '' },
  })

  const length = watch('comment').length

  async function onSubmit(values: ComplaintCommentInput) {
    setError(null)
    try {
      await addComment.mutateAsync({ complaintId, comment: values.comment })
      reset()
    } catch (cause) {
      setError(mapDbError(cause).message)
    }
  }

  return (
    <form noValidate className="space-y-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-baseline justify-between">
        <Label htmlFor="comment">Add comment</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {length}/{COMPLAINT_TEXT_MAX}
        </span>
      </div>
      <Textarea
        id="comment"
        rows={3}
        aria-invalid={errors.comment ? true : undefined}
        aria-describedby={errors.comment ? 'comment-error' : undefined}
        {...register('comment')}
      />
      {errors.comment ? (
        <p id="comment-error" role="alert" className="text-destructive text-sm">
          {errors.comment.message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
        {isSubmitting ? 'Adding…' : 'Add comment'}
      </Button>
    </form>
  )
}
