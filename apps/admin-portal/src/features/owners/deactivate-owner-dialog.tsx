import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { mapDbError } from '@/lib/db-error'
import { useDeactivateOwner, type OwnerRow } from './api'

interface DeactivateOwnerDialogProps {
  owner: OwnerRow | null
  onClose: () => void
}

export function DeactivateOwnerDialog({ owner, onClose }: DeactivateOwnerDialogProps) {
  const deactivate = useDeactivateOwner()

  async function onConfirm() {
    if (owner === null) return

    const { id: ownerId, name } = owner
    onClose()

    const toastId = toast.loading(`Deactivating ${name}…`)
    try {
      await deactivate.mutateAsync(ownerId)
      toast.success('Tenant deactivated', { id: toastId })
    } catch (caught) {
      toast.error(mapDbError(caught).message, { id: toastId })
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

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={() => void onConfirm()}>
            Deactivate
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
