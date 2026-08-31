import { toast } from 'sonner'
import { Button } from '@rental-admin/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rental-admin/components/ui/dialog'
import { mapDbError } from '@rental-admin/lib/db-error'
import { unlockBodyScroll } from '@rental-admin/lib/scroll-lock'
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
    unlockBodyScroll()

    const toastId = toast.loading(`Deactivating ${name}…`)
    try {
      await deactivate.mutateAsync(ownerId)
      toast.success('Tenant deactivated', { id: toastId })
    } catch (caught) {
      toast.error(mapDbError(caught).message, { id: toastId })
    }
  }

  return (
    <Dialog
      open={owner !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Deactivate owner account</DialogTitle>
          <DialogDescription>
            {owner === null
              ? null
              : `${owner.name} (${owner.contact_email}) is signed out of every active session and can no longer sign in to the owner portal. Existing allotments, invoices, and payments are kept.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={() => void onConfirm()}>
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
