import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getGlobalConfig,
  listFileStorageConfig,
  settingsKeys,
  type FileTypeConfigInput,
  type PaymentGracePeriodInput,
  type ReminderSettingsInput,
  type SecurityPolicyInput,
} from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export {
  settingsKeys,
  type FileStorageConfigRow,
  type GlobalConfigRow,
} from '@itoby/shared'

/** Tunables live in the single-row `global_config` (Requirements 5.8, 8.2, 11.6, 11.9). */
export function useGlobalConfig() {
  return useQuery({
    queryKey: settingsKeys.globalConfig,
    queryFn: () => getGlobalConfig(supabase()),
  })
}

/** Accepted types and per-type size ceilings (Requirement 13.4); readable by all staff. */
export function useFileStorageConfig() {
  return useQuery({
    queryKey: settingsKeys.fileStorage,
    staleTime: 5 * 60_000,
    queryFn: () => listFileStorageConfig(supabase()),
  })
}

function useConfigMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  queryKey: readonly unknown[],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export function useConfigureSecurityPolicy() {
  return useConfigMutation(async (input: SecurityPolicyInput) => {
    const { data, error } = await supabase().rpc('configure_security_policy', {
      p_session_timeout_minutes: input.session_timeout_minutes,
      p_lockout_threshold: input.lockout_threshold,
      p_lockout_duration_minutes: input.lockout_duration_minutes,
    })
    if (error) throw dbError(error, 'The security policy could not be saved.')
    return data
  }, settingsKeys.globalConfig)
}

export function useConfigureReminderSettings() {
  return useConfigMutation(async (input: ReminderSettingsInput) => {
    const { data, error } = await supabase().rpc('configure_reminder_settings', {
      p_lead_time_days: input.reminder_lead_time_days,
      p_frequency_days: input.reminder_frequency_days,
    })
    if (error) throw dbError(error, 'The reminder settings could not be saved.')
    return data
  }, settingsKeys.globalConfig)
}

export function useConfigurePaymentGracePeriod() {
  return useConfigMutation(async (input: PaymentGracePeriodInput) => {
    const { data, error } = await supabase().rpc('configure_payment_grace_period', {
      p_days: input.payment_grace_period_days,
    })
    if (error) throw dbError(error, 'The payment grace period could not be saved.')
    return data
  }, settingsKeys.globalConfig)
}

export function useConfigureFileType() {
  return useConfigMutation(async (input: FileTypeConfigInput) => {
    const { data, error } = await supabase().rpc('configure_file_types', {
      p_file_extension: input.file_extension,
      p_mime_type: input.mime_type,
      p_file_type_accepted: input.file_type_accepted,
      p_max_file_size_mb: input.max_file_size_mb,
    })
    if (error) throw dbError(error, 'The file type settings could not be saved.')
    return data
  }, settingsKeys.fileStorage)
}

export function useConfigureCompanyBilling() {
  return useConfigMutation(
    async (input: {
      company_legal_name: string
      company_gstin: string
      company_address: string
      company_phone: string
      company_email: string
      company_place_of_supply: string
      bank_name: string
      bank_account_number: string
      bank_ifsc: string
      bank_branch: string
      invoice_series_prefix: string
      default_gst_rate_percent: number
      default_hsn_sac: string
    }) => {
      const { data, error } = await supabase().rpc('configure_company_billing', {
        p_company_legal_name: input.company_legal_name,
        p_company_gstin: input.company_gstin,
        p_company_address: input.company_address,
        p_company_phone: input.company_phone,
        p_company_email: input.company_email,
        p_company_place_of_supply: input.company_place_of_supply,
        p_bank_name: input.bank_name,
        p_bank_account_number: input.bank_account_number,
        p_bank_ifsc: input.bank_ifsc,
        p_bank_branch: input.bank_branch,
        p_invoice_series_prefix: input.invoice_series_prefix,
        p_default_gst_rate_percent: input.default_gst_rate_percent,
        p_default_hsn_sac: input.default_hsn_sac,
      })
      if (error) throw dbError(error, 'The company billing profile could not be saved.')
      return data
    },
    settingsKeys.globalConfig,
  )
}
