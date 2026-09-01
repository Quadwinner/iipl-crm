import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { fileTypeConfigSchema, type FileTypeConfigInput } from '@itoby/shared'
import { Button } from '@itoby/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { mapDbError } from '@/lib/db-error'
import { useConfigureFileType, type FileStorageConfigRow } from './api'
import { NumberField } from './fields'

export type FileTypeTarget = { mode: 'create' } | { mode: 'edit'; row: FileStorageConfigRow }

const ACCEPTED = 'accepted'
const BLOCKED = 'blocked'

function defaultValues(target: FileTypeTarget | null): FileTypeConfigInput {
  if (target?.mode === 'edit') {
    return {
      file_extension: target.row.file_extension,
      mime_type: target.row.mime_type,
      file_type_accepted: target.row.file_type_accepted,
      max_file_size_mb: target.row.max_file_size_mb,
    }
  }
  return { file_extension: '', mime_type: '', file_type_accepted: true, max_file_size_mb: 10 }
}

export function FileTypeDialog({
  target,
  onClose,
}: {
  target: FileTypeTarget | null
  onClose: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const configureFileType = useConfigureFileType()
  const isEdit = target?.mode === 'edit'

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FileTypeConfigInput>({
    resolver: zodResolver(fileTypeConfigSchema),
    defaultValues: defaultValues(target),
  })

  useEffect(() => {
    setFormError(null)
    reset(defaultValues(target))
  }, [target, reset])

  async function onSubmit(values: FileTypeConfigInput) {
    setFormError(null)
    try {
      await configureFileType.mutateAsync(values)
      toast.success(`.${values.file_extension} settings saved`)
      onClose()
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit file type' : 'Add file type'}</DialogTitle>
          <DialogDescription>
            Uploads are checked against these values server-side before anything is stored.
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="file-type-extension">Extension</Label>
            <Input
              id="file-type-extension"
              readOnly={isEdit}
              maxLength={20}
              placeholder="pdf"
              aria-invalid={errors.file_extension ? true : undefined}
              aria-describedby={errors.file_extension ? 'file-type-extension-error' : undefined}
              {...register('file_extension')}
            />
            {errors.file_extension ? (
              <p id="file-type-extension-error" role="alert" className="text-destructive text-sm">
                {errors.file_extension.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-type-mime">MIME type</Label>
            <Input
              id="file-type-mime"
              maxLength={255}
              placeholder="application/pdf"
              aria-invalid={errors.mime_type ? true : undefined}
              aria-describedby={errors.mime_type ? 'file-type-mime-error' : undefined}
              {...register('mime_type')}
            />
            {errors.mime_type ? (
              <p id="file-type-mime-error" role="alert" className="text-destructive text-sm">
                {errors.mime_type.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="file-type-accepted">Status</Label>
              <Controller
                control={control}
                name="file_type_accepted"
                render={({ field }) => (
                  <Select
                    value={field.value ? ACCEPTED : BLOCKED}
                    onValueChange={(value) => field.onChange(value === ACCEPTED)}
                  >
                    <SelectTrigger id="file-type-accepted" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ACCEPTED}>Accepted</SelectItem>
                      <SelectItem value={BLOCKED}>Not accepted</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <NumberField
              id="file-type-max-size"
              label="Maximum file size"
              unit="MB"
              min={1}
              error={errors.max_file_size_mb?.message}
              registration={register('max_file_size_mb', { valueAsNumber: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save file type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
