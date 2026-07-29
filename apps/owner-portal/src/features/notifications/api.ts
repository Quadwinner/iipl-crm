import { useQuery } from '@tanstack/react-query'
import type { Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export interface ReminderPayload {
  invoice_id?: string | null
  due_date?: string
  amount?: number
  amount_due?: number
  status?: string
  manual?: boolean
}

export interface ReminderRow {
  id: Uuid
  notification_type: string
  created_at: string
  payload: ReminderPayload
}

export const reminderKeys = {
  all: ['owner-reminders'] as const,
  list: () => ['owner-reminders', 'list'] as const,
}

function isReminderType(type: string): boolean {
  return type === 'REMINDER_UPCOMING' || type === 'REMINDER_OVERDUE'
}

/** In-app bill reminders for the signed-in owner (RLS scopes to auth.uid()). */
export function useOwnerReminders() {
  return useQuery({
    queryKey: reminderKeys.list(),
    queryFn: async (): Promise<ReminderRow[]> => {
      const { data, error } = await supabase()
        .from('notifications')
        .select('id, notification_type, created_at, payload')
        .eq('channel', 'IN_APP')
        .in('notification_type', ['REMINDER_UPCOMING', 'REMINDER_OVERDUE'])
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw dbError(error, 'Reminders could not be loaded.')

      return (data ?? [])
        .filter((row) => isReminderType(row.notification_type))
        .map((row) => ({
          id: row.id,
          notification_type: row.notification_type,
          created_at: row.created_at,
          payload: (row.payload ?? {}) as ReminderPayload,
        }))
    },
    refetchInterval: 60_000,
  })
}

export function reminderTitle(row: ReminderRow): string {
  return row.notification_type === 'REMINDER_OVERDUE'
    ? 'Overdue rent reminder'
    : 'Upcoming rent reminder'
}

export function reminderAmount(row: ReminderRow): number | null {
  const value = row.payload.amount_due ?? row.payload.amount
  return typeof value === 'number' ? value : null
}
