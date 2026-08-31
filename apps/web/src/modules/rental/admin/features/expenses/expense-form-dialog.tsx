import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { EXPENSE_CATEGORIES, expenseCategoryLabel, type ExpenseCategory } from '@itoby/shared'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rental-admin/components/ui/select'
import { Textarea } from '@rental-admin/components/ui/textarea'
import { useBuildings } from '@rental-admin/features/units/api'
import { mapDbError } from '@rental-admin/lib/db-error'
import {
  useCreateExpense,
  useDeleteExpense,
  useUpdateExpense,
  type ExpenseInput,
  type ExpenseRow,
} from './api'

const expenseSchema = z.object({
  buildingId: z.string().min(1, 'Select a building.'),
  category: z.enum(EXPENSE_CATEGORIES),
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.'),
  amount: z
    .number({ error: 'Enter the amount spent.' })
    .min(0.01, 'Amount must be at least ₹0.01.')
    .max(9_999_999.99, 'Amount is too large.'),
  expenseDate: z.string().min(1, 'Expense date is required.'),
  description: z.string().trim().max(2000, 'Description is too long.').optional().or(z.literal('')),
  vendorName: z.string().trim().max(150, 'Vendor name is too long.').optional().or(z.literal('')),
  referenceNote: z
    .string()
    .trim()
    .max(200, 'Reference is too long.')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof expenseSchema>

export type ExpenseFormTarget =
  | { mode: 'create' }
  | { mode: 'edit'; expense: ExpenseRow }
  | { mode: 'delete'; expense: ExpenseRow }

interface ExpenseFormDialogProps {
  target: ExpenseFormTarget | null
  onClose: () => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ExpenseFormDialog({ target, onClose }: ExpenseFormDialogProps) {
  const buildings = useBuildings()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = target?.mode === 'edit'
  const isDelete = target?.mode === 'delete'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      buildingId: '',
      category: 'CLEANING',
      title: '',
      amount: 0,
      expenseDate: todayIso(),
      description: '',
      vendorName: '',
      referenceNote: '',
    },
  })

  const category = watch('category')
  const buildingId = watch('buildingId')

  useEffect(() => {
    if (target?.mode === 'edit') {
      reset({
        buildingId: target.expense.building_id,
        category: target.expense.category,
        title: target.expense.title,
        amount: Number(target.expense.amount),
        expenseDate: target.expense.expense_date,
        description: target.expense.description ?? '',
        vendorName: target.expense.vendor_name ?? '',
        referenceNote: target.expense.reference_note ?? '',
      })
    } else if (target?.mode === 'create') {
      reset({
        buildingId: '',
        category: 'CLEANING',
        title: '',
        amount: 0,
        expenseDate: todayIso(),
        description: '',
        vendorName: '',
        referenceNote: '',
      })
    }
    setFormError(null)
  }, [target, reset])

  function toInput(values: FormValues): ExpenseInput {
    return {
      buildingId: values.buildingId,
      category: values.category,
      title: values.title,
      amount: values.amount,
      expenseDate: values.expenseDate,
      description: values.description?.trim() || undefined,
      vendorName: values.vendorName?.trim() || undefined,
      referenceNote: values.referenceNote?.trim() || undefined,
    }
  }

  async function onSubmit(values: FormValues) {
    setFormError(null)
    try {
      if (isEdit && target?.mode === 'edit') {
        await updateExpense.mutateAsync({ id: target.expense.id, ...toInput(values) })
        toast.success('Expense updated')
      } else {
        await createExpense.mutateAsync(toInput(values))
        toast.success('Expense recorded')
      }
      onClose()
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  async function onDelete() {
    if (target?.mode !== 'delete') return
    setFormError(null)
    try {
      await deleteExpense.mutateAsync(target.expense.id)
      toast.success('Expense deleted')
      onClose()
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  if (isDelete && target?.mode === 'delete') {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
            <DialogDescription>
              Remove {target.expense.title} ({expenseCategoryLabel(target.expense.category)}) for{' '}
              {target.expense.building_name}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteExpense.isPending}
              onClick={() => void onDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'Record expense'}</DialogTitle>
          <DialogDescription>
            Track money spent on building operations — cleaning, guard salary, diesel, and other
            costs.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="expense-building">Building</Label>
              <Select
                value={buildingId || undefined}
                onValueChange={(value) =>
                  setValue('buildingId', value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="expense-building" aria-invalid={!!errors.buildingId}>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  {(buildings.data ?? []).map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.buildingId ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.buildingId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setValue('category', value as ExpenseCategory, { shouldValidate: true })
                }
              >
                <SelectTrigger id="expense-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {expenseCategoryLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                aria-invalid={!!errors.expenseDate}
                {...register('expenseDate')}
              />
              {errors.expenseDate ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.expenseDate.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="expense-title">Title</Label>
              <Input
                id="expense-title"
                placeholder="e.g. July guard salary, diesel for generator"
                aria-invalid={!!errors.title}
                {...register('title')}
              />
              {errors.title ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount (₹)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min={0.01}
                aria-invalid={!!errors.amount}
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount ? (
                <p role="alert" className="text-destructive text-sm">
                  {errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-vendor">Paid to (optional)</Label>
              <Input
                id="expense-vendor"
                placeholder="Vendor or staff name"
                {...register('vendorName')}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="expense-reference">Bill / receipt ref (optional)</Label>
              <Input
                id="expense-reference"
                placeholder="Invoice or voucher number"
                {...register('referenceNote')}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="expense-description">Notes (optional)</Label>
              <Textarea
                id="expense-description"
                rows={3}
                placeholder="Any extra detail about this expense"
                {...register('description')}
              />
            </div>
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
              {isEdit ? 'Save changes' : 'Record expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
