import { useEffect, useState } from 'react'
import { Controller, useForm, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { officeUnitInputSchema, type OfficeUnitInput } from '@itoby/shared'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rental-admin/components/ui/select'
import { mapDbError } from '@rental-admin/lib/db-error'
import { OCCUPANCY_LABELS } from './labels'
import { useCreateUnit, useUpdateUnit, type BuildingOption, type UnitRow } from './api'

export type UnitFormTarget = { mode: 'create' } | { mode: 'edit'; unit: UnitRow }

interface UnitFormDialogProps {
  target: UnitFormTarget | null
  buildings: BuildingOption[]
  onClose: () => void
}

const UNIT_CODE_CONFLICT = {
  field: 'unit_code',
  message: 'That unit code already exists in the selected building.',
} as const

function defaultValues(target: UnitFormTarget | null): DefaultValues<OfficeUnitInput> {
  if (target?.mode === 'edit') {
    const { unit } = target
    return {
      building_id: unit.building_id,
      unit_code: unit.unit_code,
      floor: unit.floor,
      size_sqft: unit.size_sqft,
      base_rent_amount: unit.base_rent_amount,
    }
  }
  // Numeric fields start undefined so the inputs render empty rather than as 0 or NaN.
  return {
    building_id: '',
    unit_code: '',
    floor: undefined,
    size_sqft: undefined,
    base_rent_amount: undefined,
  }
}

export function UnitFormDialog({ target, buildings, onClose }: UnitFormDialogProps) {
  const isEdit = target?.mode === 'edit'
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OfficeUnitInput>({
    resolver: zodResolver(officeUnitInputSchema),
    defaultValues: defaultValues(target),
  })

  useEffect(() => {
    setFormError(null)
    reset(defaultValues(target))
  }, [target, reset])

  async function onSubmit(values: OfficeUnitInput) {
    setFormError(null)
    try {
      if (target?.mode === 'edit') {
        await updateUnit.mutateAsync({ id: target.unit.id, ...values })
        toast.success(`Unit ${values.unit_code} updated`)
      } else {
        await createUnit.mutateAsync(values)
        toast.success(`Unit ${values.unit_code} created`)
      }
      onClose()
    } catch (error) {
      const inline = mapDbError(error, UNIT_CODE_CONFLICT)
      if (inline.field === 'unit_code') {
        setError('unit_code', { type: 'server', message: inline.message })
        return
      }
      setFormError(inline.message)
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit office unit' : 'New office unit'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Occupancy status is set by allotments and is not editable here.'
              : 'A new unit starts vacant.'}
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="unit-building">Building</Label>
            <Controller
              control={control}
              name="building_id"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="unit-building"
                    className="w-full"
                    aria-invalid={errors.building_id ? true : undefined}
                    aria-describedby={errors.building_id ? 'unit-building-error' : undefined}
                  >
                    <SelectValue placeholder="Select a building" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.building_id ? (
              <p id="unit-building-error" role="alert" className="text-destructive text-sm">
                {errors.building_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit-code">Unit code</Label>
              <Input
                id="unit-code"
                maxLength={50}
                aria-invalid={errors.unit_code ? true : undefined}
                aria-describedby={errors.unit_code ? 'unit-code-error' : undefined}
                {...register('unit_code')}
              />
              {errors.unit_code ? (
                <p id="unit-code-error" role="alert" className="text-destructive text-sm">
                  {errors.unit_code.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-floor">Floor</Label>
              <Input
                id="unit-floor"
                type="number"
                step="1"
                min={-5}
                max={200}
                aria-invalid={errors.floor ? true : undefined}
                aria-describedby={errors.floor ? 'unit-floor-error' : undefined}
                {...register('floor', { valueAsNumber: true })}
              />
              {errors.floor ? (
                <p id="unit-floor-error" role="alert" className="text-destructive text-sm">
                  {errors.floor.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-size">Size (sq ft)</Label>
              <Input
                id="unit-size"
                type="number"
                step="0.01"
                aria-invalid={errors.size_sqft ? true : undefined}
                aria-describedby={errors.size_sqft ? 'unit-size-error' : undefined}
                {...register('size_sqft', { valueAsNumber: true })}
              />
              {errors.size_sqft ? (
                <p id="unit-size-error" role="alert" className="text-destructive text-sm">
                  {errors.size_sqft.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-rent">Base rent (₹)</Label>
              <Input
                id="unit-rent"
                type="number"
                step="0.01"
                aria-invalid={errors.base_rent_amount ? true : undefined}
                aria-describedby={errors.base_rent_amount ? 'unit-rent-error' : undefined}
                {...register('base_rent_amount', { valueAsNumber: true })}
              />
              {errors.base_rent_amount ? (
                <p id="unit-rent-error" role="alert" className="text-destructive text-sm">
                  {errors.base_rent_amount.message}
                </p>
              ) : null}
            </div>
          </div>

          {target?.mode === 'edit' ? (
            <p className="text-muted-foreground text-sm">
              Occupancy status: {OCCUPANCY_LABELS[target.unit.occupancy_status]}
              {target.unit.occupancy_status === 'OCCUPIED'
                ? ' — changing base rent also updates the active lease and unpaid invoices.'
                : ''}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
