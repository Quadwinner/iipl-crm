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
} from '@/components/ui/alert-dialog'
import { EdgeFunctionError } from '@/lib/edge-function'
import { useDeactivateOwner, type OwnerRow } from './api'

interface DeactivateOwnerDialogProps {
  owner: OwnerRow | null
  onClose: () => void
}

export function DeactivateOwnerDialog({ owner, onClose }: DeactivateOwnerDialogProps) {
  const deactivate = useDeactivateOwner()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (owner !== null) setError(null)
  }, [owner])

  async function onConfirm() {
    if (owner === null) return
    setError(null)
    try {
      await deactivate.mutateAsync(owner.id)
      toast.success('Owner account deactivated')
      onClose()
    } catch (caught) {
      const status = caught instanceof EdgeFunctionError ? caught.status : 0
      if (status === 401 || status === 403) {
        setError('Your role is not permitted to deactivate owner accounts.')
        return
      }
      if (status === 404) {
        setError('This owner account no longer exists. Refresh the list.')
        return
      }
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  return (
    <AlertDialog
      open={owner !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate owner account</AlertDialogTitle>
          <AlertDialogDescription>
            {owner === null
              ? null
              : `${owner.name} (${owner.contact_email}) is signed out of every active session and can no longer sign in to the owner portal. Existing allotments, invoices, and payments are kept.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivate.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
          >
            {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
