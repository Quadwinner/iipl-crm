import { useQuery } from '@tanstack/react-query'
import { listOwnerReminders, reminderKeys } from '@itoby/shared'
import { supabase } from '@rental-owner/lib/supabase'

export {
  reminderAmount,
  reminderKeys,
  reminderTitle,
  type ReminderPayload,
  type ReminderRow,
} from '@itoby/shared'

export function useOwnerReminders() {
  return useQuery({
    queryKey: reminderKeys.list(),
    queryFn: () => listOwnerReminders(supabase()),
    refetchInterval: 60_000,
  })
}
