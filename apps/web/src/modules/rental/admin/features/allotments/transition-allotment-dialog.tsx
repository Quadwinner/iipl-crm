import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EXPIRATION_REASON_MAX, type TerminalAllotmentStatus } from '@itoby/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@itoby/ui'
import { Label } from '@itoby/ui'
import { Textarea } from '@itoby/ui'
import { DbError } from '@rental-admin/lib/db-error'
import { formatDate, isPastDate } from '@rental-admin/lib/format'
import { useTransitionAllotment, type AllotmentListRow } from './api'

export interface TransitionRequest {
  allotment: AllotmentListRow
  targetStatus: TerminalAllotmentStatus
}

interface TransitionAllotmentDialogProps {
  request: TransitionRequest | null
  onClose: () => void
}

export function TransitionAllotmentDialog({ request, onClose }: TransitionAllotmentDialogProps) {
  const transition = useTransitionAllotment()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isExpiry = request?.targetStatus === 'EXPIRED'
  const pastDue = isPastDate(request?.allotment.lease_end)

  useEffect(() => {
    if (request === null) return
    setError(null)
    setReason(
      request.targetStatus === 'EXPIRED' && isPastDate(request.allotment.lease_end)
        ? `Lease end date ${formatDate(request.allotment.lease_end)} has passed.`
        : '',
    )
  }, [request])

  async function onConfirm() {
    if (request === null) return
    const trimmed = reason.trim()

    if (isExpiry && trimmed.length === 0) {
      setError('Enter the expiration reason.')
      return
    }
    if (trimmed.length > EXPIRATION_REASON_MAX) {
      setError(`Reason must not exceed ${EXPIRATION_REASON_MAX} characters.`)
      return
    }

    setError(null)
    try {
      await transition.mutateAsync({
        allotmentId: request.allotment.id,
        targetStatus: request.targetStatus,
        reason: isExpiry ? trimmed : undefined,
      })
      toast.success(isExpiry ? 'Allotment expired' : 'Allotment terminated')
      onClose()
    } catch (caught) {
      const code = caught instanceof DbError ? caught.code : null
      const message = caught instanceof Error ? caught.message : String(caught)

      if (code === '55006') {
        setError('This allotment is already terminated or expired. Refresh the list.')
        return
      }
      if (code === '42501') {
        setError('Your role is not permitted to change allotments.')
        return
      }
      if (code === 'P0002') {
        setError('This allotment no longer exists. Refresh the list.')
        return
      }
      setError(message)
    }
  }

  const title = isExpiry
    ? pastDue
      ? 'Force expire allotment'
      : 'Expire allotment'
    : 'Terminate allotment'

  return (
    <AlertDialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {request === null
              ? null
              : `${request.allotment.building_name} · ${request.allotment.unit_code} — ${request.allotment.owner_name}. ` +
                `The unit becomes vacant and the allotment cannot be reactivated.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isExpiry ? (
          <div className="space-y-2">
            <Label htmlFor="expiration-reason">Expiration reason</Label>
            <Textarea
              id="expiration-reason"
              rows={3}
              value={reason}
              maxLength={EXPIRATION_REASON_MAX}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'transition-error' : undefined}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        ) : null}

        {error ? (
          <p id="transition-error" role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={transition.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={transition.isPending}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {transition.isPending ? 'Working…' : isExpiry ? 'Expire' : 'Terminate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
