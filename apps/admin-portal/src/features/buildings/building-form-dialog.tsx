import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mapDbError } from '@/lib/db-error'
import {
  useCreateBuilding,
  useUpdateBuilding,
  type BuildingInput,
  type BuildingRow,
} from './api'

const buildingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(150, 'Name must be at most 150 characters.'),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required.')
    .max(500, 'Address must be at most 500 characters.'),
})

export type BuildingFormTarget = { mode: 'create' } | { mode: 'edit'; building: BuildingRow }

interface BuildingFormDialogProps {
  target: BuildingFormTarget | null
  onClose: () => void
}

export function BuildingFormDialog({ target, onClose }: BuildingFormDialogProps) {
  const isEdit = target?.mode === 'edit'
  const createBuilding = useCreateBuilding()
  const updateBuilding = useUpdateBuilding()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuildingInput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { name: '', address: '' },
  })

  useEffect(() => {
    if (target?.mode === 'edit') {
      reset({ name: target.building.name, address: target.building.address })
    } else {
      reset({ name: '', address: '' })
    }
    setFormError(null)
  }, [target, reset])

  async function onSubmit(values: BuildingInput) {
    setFormError(null)
    try {
      if (isEdit && target?.mode === 'edit') {
        await updateBuilding.mutateAsync({ id: target.building.id, ...values })
        toast.success('Building updated')
      } else {
        await createBuilding.mutateAsync(values)
        toast.success('Building created')
      }
      onClose()
    } catch (error) {
      const mapped = mapDbError(error)
      setFormError(mapped.message)
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit building' : 'New building'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the building name and address.'
              : 'Add a property that will contain office units.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="building-name">Name</Label>
            <Input id="building-name" autoFocus {...register('name')} aria-invalid={!!errors.name} />
            {errors.name ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="building-address">Address</Label>
            <Input
              id="building-address"
              {...register('address')}
              aria-invalid={!!errors.address}
            />
            {errors.address ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.address.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create building'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
