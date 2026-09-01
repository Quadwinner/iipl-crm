import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  expenseKeys,
  listExpenses,
  type ExpenseCategory,
  type ExpenseFilters,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

export {
  EMPTY_EXPENSE_FILTERS,
  expenseKeys,
  expenseTotals,
  type ExpenseFilters,
  type ExpenseRow,
} from '@itoby/shared'

export interface ExpenseInput {
  buildingId: Uuid
  category: ExpenseCategory
  title: string
  amount: number
  expenseDate: string
  description?: string
  vendorName?: string
  referenceNote?: string
}

export function useExpenseList(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => listExpenses(supabase(), filters),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { data, error } = await supabase().rpc('create_building_expense', {
        p_building_id: input.buildingId,
        p_category: input.category,
        p_title: input.title.trim(),
        p_amount: input.amount,
        p_expense_date: input.expenseDate,
        p_description: input.description?.trim() || undefined,
        p_vendor_name: input.vendorName?.trim() || undefined,
        p_reference_note: input.referenceNote?.trim() || undefined,
      })
      if (error) throw dbError(error, 'The expense could not be recorded.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: ExpenseInput & { id: Uuid }) => {
      const { data, error } = await supabase().rpc('update_building_expense', {
        p_expense_id: id,
        p_building_id: input.buildingId,
        p_category: input.category,
        p_title: input.title.trim(),
        p_amount: input.amount,
        p_expense_date: input.expenseDate,
        p_description: input.description?.trim() || undefined,
        p_vendor_name: input.vendorName?.trim() || undefined,
        p_reference_note: input.referenceNote?.trim() || undefined,
      })
      if (error) throw dbError(error, 'The expense could not be updated.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: Uuid) => {
      const { error } = await supabase().rpc('delete_building_expense', { p_expense_id: id })
      if (error) throw dbError(error, 'The expense could not be deleted.')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
