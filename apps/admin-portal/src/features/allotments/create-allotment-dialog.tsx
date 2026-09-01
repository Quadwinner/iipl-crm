import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  allotmentCreateSchema,
  BILLING_CYCLES,
  type AllotmentCreateInput,
  type BillingCycle,
} from '@itoby/shared'
import { Button } from '@itoby/ui'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@itoby/ui'
import { DbError } from '@/lib/db-error'
import { todayIsoDate } from '@/lib/format'
import { useCreateAllotment, useVacantUnits, type OwnerOption } from './api'

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

interface CreateAllotmentDialogProps {
  owners: OwnerOption[]
  ownersLoading: boolean
}

export function CreateAllotmentDialog({ owners, ownersLoading }: CreateAllotmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const vacantUnits = useVacantUnits()
  const createAllotment = useCreateAllotment()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AllotmentCreateInput>({
    resolver: zodResolver(allotmentCreateSchema),
    defaultValues: {
      office_unit_id: '',
      office_owner_id: '',
      lease_start: todayIsoDate(),
      lease_end: '',
      rent_amount: 0,
      billing_cycle: 'MONTHLY',
    },
  })

  const selectedUnitId = watch('office_unit_id')
  const selectedOwnerId = watch('office_owner_id')
  const selectedCycle = watch('billing_cycle')
  const activeOwners = owners.filter((owner) => owner.status === 'ACTIVE')

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setFormError(null)
    }
  }

  async function onSubmit(values: AllotmentCreateInput) {
    setFormError(null)
    try {
      await createAllotment.mutateAsync(values)
      toast.success('Allotment created')
      onOpenChange(false)
    } catch (error) {
      const code = error instanceof DbError ? error.code : null
      const message = error instanceof Error ? error.message : String(error)

      // 55006/23505 both mean the unit was taken between listing and submit.
      if (code === '55006' || code === '23505') {
        setError('office_unit_id', {
          message: 'This unit is already occupied. Pick another vacant unit.',
        })
        void vacantUnits.refetch()
        return
      }
      if (code === 'P0002') {
        setFormError('The selected unit or owner no longer exists. Reload and try again.')
        return
      }
      if (code === '42501') {
        setFormError('Your role is not permitted to create allotments.')
        return
      }
      setFormError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          New allotment
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New allotment</DialogTitle>
          <DialogDescription>
            Allot a vacant unit to an office owner. This sets the unit to occupied.
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="office_unit_id">Office unit</Label>
            <Select
              value={selectedUnitId}
              onValueChange={(value) => {
                setValue('office_unit_id', value, { shouldValidate: true })
                const unit = vacantUnits.data?.find((option) => option.id === value)
                if (unit) setValue('rent_amount', unit.base_rent_amount, { shouldValidate: true })
              }}
            >
              <SelectTrigger
                id="office_unit_id"
                className="w-full"
                aria-invalid={errors.office_unit_id ? true : undefined}
                aria-describedby={errors.office_unit_id ? 'office_unit_id-error' : undefined}
              >
                <SelectValue
                  placeholder={vacantUnits.isPending ? 'Loading vacant units…' : 'Select a unit'}
                />
              </SelectTrigger>
              <SelectContent>
                {(vacantUnits.data ?? []).map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.building_name} · {unit.unit_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vacantUnits.data?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No vacant units available.</p>
            ) : null}
            {errors.office_unit_id ? (
              <p id="office_unit_id-error" role="alert" className="text-destructive text-sm">
                {errors.office_unit_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_owner_id">Office owner</Label>
            <Select
              value={selectedOwnerId}
              onValueChange={(value) =>
                setValue('office_owner_id', value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="office_owner_id"
                className="w-full"
                aria-invalid={errors.office_owner_id ? true : undefined}
                aria-describedby={errors.office_owner_id ? 'office_owner_id-error' : undefined}
              >
                <SelectValue placeholder={ownersLoading ? 'Loading owners…' : 'Select an owner'} />
              </SelectTrigger>
              <SelectContent>
                {activeOwners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    {owner.name} · {owner.contact_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.office_owner_id ? (
              <p id="office_owner_id-error" role="alert" className="text-destructive text-sm">
                {errors.office_owner_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lease_start">Lease start</Label>
              <Input
                id="lease_start"
                type="date"
                aria-invalid={errors.lease_start ? true : undefined}
                aria-describedby={errors.lease_start ? 'lease_start-error' : undefined}
                {...register('lease_start')}
              />
              {errors.lease_start ? (
                <p id="lease_start-error" role="alert" className="text-destructive text-sm">
                  {errors.lease_start.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease_end">Lease end</Label>
              <Input
                id="lease_end"
                type="date"
                aria-invalid={errors.lease_end ? true : undefined}
                aria-describedby={errors.lease_end ? 'lease_end-error' : undefined}
                {...register('lease_end')}
              />
              {errors.lease_end ? (
                <p id="lease_end-error" role="alert" className="text-destructive text-sm">
                  {errors.lease_end.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent_amount">Rent amount (₹)</Label>
              <Input
                id="rent_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                aria-invalid={errors.rent_amount ? true : undefined}
                aria-describedby={errors.rent_amount ? 'rent_amount-error' : undefined}
                {...register('rent_amount', { valueAsNumber: true })}
              />
              {errors.rent_amount ? (
                <p id="rent_amount-error" role="alert" className="text-destructive text-sm">
                  {errors.rent_amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing cycle</Label>
              <Select
                value={selectedCycle}
                onValueChange={(value) =>
                  setValue('billing_cycle', value as BillingCycle, { shouldValidate: true })
                }
              >
                <SelectTrigger id="billing_cycle" className="w-full">
                  <SelectValue placeholder="Select a cycle" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {BILLING_CYCLE_LABELS[cycle]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create allotment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
