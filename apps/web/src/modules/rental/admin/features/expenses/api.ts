import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database, ExpenseCategory, Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

export type ExpenseRow = Database['public']['Functions']['list_building_expenses']['Returns'][number]

export interface ExpenseFilters {
  buildingId: Uuid | null
  category: ExpenseCategory | null
  startDate: string
  endDate: string
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  buildingId: null,
  category: null,
  startDate: '',
  endDate: '',
}

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

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) =>
    [
      'expenses',
      'list',
      filters.buildingId,
      filters.category,
      filters.startDate,
      filters.endDate,
    ] as const,
}

export function useExpenseList(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: async (): Promise<ExpenseRow[]> => {
      const { data, error } = await supabase().rpc('list_building_expenses', {
        p_building_id: filters.buildingId ?? undefined,
        p_category: filters.category ?? undefined,
        p_start_date: filters.startDate || undefined,
        p_end_date: filters.endDate || undefined,
      })
      if (error) throw dbError(error, 'Expenses could not be loaded.')
      return data ?? []
    },
  })
}

export function expenseTotals(rows: ExpenseRow[]): { count: number; total: number } {
  return rows.reduce(
    (acc, row) => ({
      count: acc.count + 1,
      total: acc.total + Number(row.amount),
    }),
    { count: 0, total: 0 },
  )
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
