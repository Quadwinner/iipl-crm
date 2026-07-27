import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { documentLinkSchema, type DocumentLinkInput } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOwnerOptions } from '@/features/lookups/api'
import { useFileStorageConfig } from '@/features/settings/api'
import { EdgeFunctionError } from '@/lib/edge-function'
import { formatDate } from '@/lib/format'
import {
  acceptAttribute,
  acceptedTypesSummary,
  fileRejection,
  useOwnerLeases,
  useUploadDocument,
} from './api'

const NO_LEASE = '__none'

export function UploadDocumentDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const owners = useOwnerOptions()
  const storageConfig = useFileStorageConfig()
  const uploadDocument = useUploadDocument()

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DocumentLinkInput>({
    resolver: zodResolver(documentLinkSchema),
    defaultValues: { office_owner_id: '', lease_id: '' },
  })

  const ownerId = watch('office_owner_id')
  const leases = useOwnerLeases(ownerId || null)
  const config = storageConfig.data ?? []

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset({ office_owner_id: '', lease_id: '' })
      setFile(null)
      setFileError(null)
      setFormError(null)
    }
  }

  function onFileChange(selected: File | null) {
    setFile(selected)
    setFormError(null)
    setFileError(selected ? fileRejection(selected, config) : null)
  }

  async function onSubmit(values: DocumentLinkInput) {
    setFormError(null)
    if (!file) {
      setFileError('Choose a file to upload.')
      return
    }
    const rejection = fileRejection(file, config)
    if (rejection) {
      setFileError(rejection)
      return
    }

    try {
      await uploadDocument.mutateAsync({
        file,
        officeOwnerId: values.office_owner_id,
        leaseId: values.lease_id || null,
      })
      toast.success(`${file.name} uploaded`)
      onOpenChange(false)
    } catch (error) {
      const code = error instanceof EdgeFunctionError ? error.code : null
      const status = error instanceof EdgeFunctionError ? error.status : 0
      const message = error instanceof Error ? error.message : String(error)

      if (code === 'FILE_TYPE_NOT_ACCEPTED' || code === 'FILE_TOO_LARGE') {
        setFileError(message)
        return
      }
      if (status === 401 || status === 403) {
        setFormError('Your role is not permitted to upload documents.')
        return
      }
      setFormError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          Upload document
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>
            Link the file to an office owner, and to one of their leases when it is a lease
            document.
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="document-owner">Office owner</Label>
            <Controller
              control={control}
              name="office_owner_id"
              render={({ field }) => (
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="document-owner"
                    className="w-full"
                    aria-invalid={errors.office_owner_id ? true : undefined}
                    aria-describedby={errors.office_owner_id ? 'document-owner-error' : undefined}
                  >
                    <SelectValue placeholder="Select an office owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(owners.data ?? []).map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.office_owner_id ? (
              <p id="document-owner-error" role="alert" className="text-destructive text-sm">
                {errors.office_owner_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-lease">Lease (optional)</Label>
            <Controller
              control={control}
              name="lease_id"
              render={({ field }) => (
                <Select
                  value={field.value || NO_LEASE}
                  disabled={!ownerId}
                  onValueChange={(value) => field.onChange(value === NO_LEASE ? '' : value)}
                >
                  <SelectTrigger id="document-lease" className="w-full">
                    <SelectValue placeholder="No lease link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LEASE}>No lease link</SelectItem>
                    {(leases.data ?? []).map((lease) => (
                      <SelectItem key={lease.id} value={lease.id}>
                        {lease.unit_code} · {formatDate(lease.start_date)} –{' '}
                        {formatDate(lease.end_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {leases.isError ? (
              <p role="alert" className="text-destructive text-sm">
                {leases.error.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-file">File</Label>
            <Input
              id="document-file"
              type="file"
              accept={acceptAttribute(config) || undefined}
              aria-invalid={fileError ? true : undefined}
              aria-describedby={
                fileError ? 'document-file-error document-file-hint' : 'document-file-hint'
              }
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            <p id="document-file-hint" className="text-muted-foreground text-sm">
              {storageConfig.isPending
                ? 'Loading accepted file types…'
                : `Accepted: ${acceptedTypesSummary(config)}`}
            </p>
            {fileError ? (
              <p id="document-file-error" role="alert" className="text-destructive text-sm">
                {fileError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
