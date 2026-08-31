import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@rental-admin/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rental-admin/components/ui/dialog'
import { Input } from '@rental-admin/components/ui/input'
import { Label } from '@rental-admin/components/ui/label'
import { mapDbError } from '@rental-admin/lib/db-error'
import { formatCurrency } from '@rental-admin/lib/format'
import { useUpdateLeaseRent, type AllotmentListRow } from './api'

const schema = z.object({
  rent_amount: z
    .number({ error: 'Enter the new rent amount.' })
    .min(0.01, 'Rent must be greater than zero.')
    .max(9_999_999.99, 'Rent is too large.'),
})

type FormValues = z.infer<typeof schema>

export interface EditRentRequest {
  allotment: AllotmentListRow
}

interface EditLeaseRentDialogProps {
  request: EditRentRequest | null
  onClose: () => void
}

export function EditLeaseRentDialog({ request, onClose }: EditLeaseRentDialogProps) {
  const updateRent = useUpdateLeaseRent()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rent_amount: request?.allotment.rent_amount ?? 0 },
  })

  useEffect(() => {
    if (!request) return
    reset({ rent_amount: request.allotment.rent_amount ?? 0 })
    setFormError(null)
  }, [request, reset])

  async function onSubmit(values: FormValues) {
    if (!request) return
    setFormError(null)
    try {
      await updateRent.mutateAsync({
        allotmentId: request.allotment.id,
        rentAmount: values.rent_amount,
      })
      toast.success('Lease rent updated — owner portal will show the new amount')
      onClose()
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit lease rent</DialogTitle>
          <DialogDescription>
            {request
              ? `${request.allotment.building_name} · ${request.allotment.unit_code} — ${request.allotment.owner_name}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="lease-rent-amount">Monthly rent (₹)</Label>
            <Input
              id="lease-rent-amount"
              type="number"
              step="0.01"
              min={0.01}
              disabled={isSubmitting}
              aria-invalid={!!errors.rent_amount}
              {...register('rent_amount', { valueAsNumber: true })}
            />
            {errors.rent_amount ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.rent_amount.message}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Updates the active lease, unit base rent, and any unpaid invoices.
                {request?.allotment.rent_amount != null
                  ? ` Current: ${formatCurrency(request.allotment.rent_amount)}.`
                  : ''}
              </p>
            )}
          </div>

          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save rent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
