import { useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  COMPLAINT_ATTACHMENT_MAX_COUNT,
  COMPLAINT_TEXT_MAX,
  complaintSubmissionSchema,
  type ComplaintSubmissionInput,
} from '@itoby/shared'

import { Button } from '@itoby/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@itoby/ui'
import { Textarea } from '@itoby/ui'
import { mapDbError } from '@rental-owner/lib/db-error'
import { formatFileSize } from '@rental-owner/lib/format'
import {
  acceptedTypesAttribute,
  acceptedTypesSummary,
  attachmentCountRejection,
  attachmentRejection,
  useAllottedUnits,
  useComplaintCategories,
  useFileTypeRules,
  useSubmitComplaint,
} from './api'

export function SubmitComplaintForm() {
  const units = useAllottedUnits()
  const categories = useComplaintCategories()
  const fileTypes = useFileTypeRules()
  const submit = useSubmitComplaint()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComplaintSubmissionInput>({
    resolver: zodResolver(complaintSubmissionSchema),
    defaultValues: { office_unit_id: '', category: '', description: '' },
  })

  const rules = fileTypes.data ?? []
  const description = watch('description')
  const unitId = watch('office_unit_id')
  const category = watch('category')

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? [])
    const problems: string[] = []

    const countProblem = attachmentCountRejection(picked.length)
    if (countProblem) problems.push(countProblem)

    for (const file of picked) {
      const problem = attachmentRejection(file, rules)
      if (problem) problems.push(problem)
    }

    setFileErrors(problems)
    setAttachments(problems.length === 0 ? picked : [])
  }

  async function onSubmit(values: ComplaintSubmissionInput) {
    setFormError(null)
    setResult(null)

    if (fileErrors.length > 0) return

    try {
      const outcome = await submit.mutateAsync({ ...values, attachments })
      reset({ office_unit_id: '', category: '', description: '' })
      setAttachments([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setResult(
        outcome.attachmentErrors.length === 0
          ? 'Complaint raised. It is now open with the maintenance team.'
          : 'Complaint raised, but some attachments were rejected.',
      )
      setFileErrors(outcome.attachmentErrors)
    } catch (cause) {
      const inline = mapDbError(cause)
      // 22023 covers both an unlisted category and an out-of-range description.
      if (inline.message.toLowerCase().includes('category')) {
        setError('category', { type: 'server', message: inline.message })
      } else if (inline.message.toLowerCase().includes('description')) {
        setError('description', { type: 'server', message: inline.message })
      } else if (inline.message.toLowerCase().includes('allotted')) {
        setError('office_unit_id', {
          type: 'server',
          message: 'That office unit is not currently allotted to you.',
        })
      } else {
        setFormError(inline.message)
      }
    }
  }

  const noUnits = !units.isPending && (units.data ?? []).length === 0

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="text-base">Raise a complaint</CardTitle>
      </CardHeader>
      <CardContent>
        {noUnits ? (
          <p className="text-muted-foreground text-sm">
            You have no currently-allotted office unit, so no complaint can be raised.
          </p>
        ) : (
          <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="complaint-unit">Office unit</Label>
                <Select
                  value={unitId}
                  onValueChange={(value) =>
                    setValue('office_unit_id', value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="complaint-unit" className="w-full">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {(units.data ?? []).map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_code} · {unit.building_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.office_unit_id ? (
                  <p role="alert" className="text-destructive text-sm">
                    {errors.office_unit_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="complaint-category">Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
                >
                  <SelectTrigger id="complaint-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.data ?? []).map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category ? (
                  <p role="alert" className="text-destructive text-sm">
                    {errors.category.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="complaint-description">Description</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {description.length}/{COMPLAINT_TEXT_MAX}
                </span>
              </div>
              <Textarea
                id="complaint-description"
                rows={4}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? 'complaint-description-error' : undefined}
                {...register('description')}
              />
              {errors.description ? (
                <p
                  id="complaint-description-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="complaint-attachments">Attachments (optional)</Label>
              <Input
                id="complaint-attachments"
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypesAttribute(rules)}
                aria-describedby="complaint-attachments-hint"
                onChange={onFilesChange}
              />
              <p id="complaint-attachments-hint" className="text-muted-foreground text-xs">
                Up to {COMPLAINT_ATTACHMENT_MAX_COUNT} files, 10 MB each.{' '}
                {acceptedTypesSummary(rules)}
              </p>
              {attachments.length > 0 ? (
                <ul className="text-muted-foreground text-xs">
                  {attachments.map((file) => (
                    <li key={file.name}>
                      {file.name} · {formatFileSize(file.size)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {fileErrors.length > 0 ? (
                <ul role="alert" className="text-destructive space-y-0.5 text-sm">
                  {fileErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {formError ? (
              <p role="alert" className="text-destructive text-sm">
                {formError}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit complaint'}
              </Button>
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {result ?? ''}
              </p>
            </div>
          </form>
        )}

        {units.isError ? (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {units.error.message}
          </p>
        ) : null}
        {categories.isError ? (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {categories.error.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
