import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import { mapDbError } from '@rental-admin/lib/db-error'
import { useSetStaffActive, type StaffRow } from './api'

interface DeactivateStaffDialogProps {
  staff: StaffRow | null
  onClose: () => void
}

export function DeactivateStaffDialog({ staff, onClose }: DeactivateStaffDialogProps) {
  const setActive = useSetStaffActive()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (staff !== null) setError(null)
  }, [staff])

  async function onConfirm() {
    if (staff === null) return
    setError(null)
    try {
      await setActive.mutateAsync({ userId: staff.user_id, active: false })
      toast.success('Staff member deactivated')
      onClose()
    } catch (cause) {
      setError(mapDbError(cause).message)
    }
  }

  return (
    <AlertDialog
      open={staff !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate staff member</AlertDialogTitle>
          <AlertDialogDescription>
            {staff === null
              ? null
              : `${staff.full_name ?? staff.email} can no longer be assigned maintenance complaints, and any complaint already assigned to them stays assigned until reassigned. Reactivating requires another administrator action.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={setActive.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={setActive.isPending}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {setActive.isPending ? 'Deactivating…' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
