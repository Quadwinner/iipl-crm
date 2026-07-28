import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { GatewayType, PaymentStatus, Uuid } from '@itoby/shared'
import { EMPTY_BILLING_FILTERS, useBillingReport } from '@/features/billing/api'
import { useAllotments } from '@/features/allotments/api'
import { useComplaints, EMPTY_COMPLAINT_FILTERS } from '@/features/complaints/api'
import { useDocuments } from '@/features/documents/api'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'
import { ownerKeys, useOwners, type OwnerRow } from '@/features/owners/api'

export interface TenantPaymentRow {
  id: Uuid
  amount: number
  status: PaymentStatus
  gateway: GatewayType
  transaction_ref: string | null
  created_at: string
  completed_at: string | null
  invoice_id: Uuid
  billing_cycle_key: string | null
  unit_code: string | null
}

export interface TenantListRow extends OwnerRow {
  active_units: string[]
  outstanding_balance: number
  last_payment_at: string | null
}

export const tenantKeys = {
  all: ['tenants'] as const,
  enriched: ['tenants', 'enriched'] as const,
  detail: (ownerId: Uuid) => ['tenants', 'detail', ownerId] as const,
  payments: (ownerId: Uuid | null) => ['tenants', 'payments', ownerId] as const,
}

export function useTenant(ownerId: Uuid | undefined) {
  return useQuery({
    queryKey: ownerId ? tenantKeys.detail(ownerId) : ['tenants', 'detail', 'missing'],
    enabled: Boolean(ownerId),
    queryFn: async (): Promise<OwnerRow> => {
      const { data, error } = await supabase()
        .from('office_owners')
        .select('id, user_id, name, contact_email, phone, status, created_at, updated_at')
        .eq('id', ownerId as Uuid)
        .single()
      if (error) throw dbError(error, 'Tenant could not be loaded.')
      return data
    },
  })
}

export function useEnrichedTenants() {
  const owners = useOwners({ status: null })
  const allotments = useAllotments({ status: 'ACTIVE', ownerId: null })
  const billing = useBillingReport(EMPTY_BILLING_FILTERS)
  const payments = useAllPayments()

  const isPending =
    owners.isPending || allotments.isPending || billing.isPending || payments.isPending
  const isError = owners.isError || allotments.isError || billing.isError || payments.isError
  const error = owners.error ?? allotments.error ?? billing.error ?? payments.error

  const data = useMemo((): TenantListRow[] | undefined => {
    if (!owners.data || !allotments.data || !billing.data || !payments.data) {
      return undefined
    }

    return owners.data.map((owner) => {
      const activeUnits = allotments.data
        .filter((row) => row.office_owner_id === owner.id)
        .map((row) => `${row.building_name} · ${row.unit_code}`)

      const outstanding = billing.data
        .filter((row) => row.office_owner_id === owner.id && row.status !== 'PAID')
        .reduce((sum, row) => sum + row.total_amount, 0)

      const ownerPayments = payments.data
        .filter((row) => row.office_owner_id === owner.id && row.status === 'COMPLETED')
        .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at))

      return {
        ...owner,
        active_units: activeUnits,
        outstanding_balance: outstanding,
        last_payment_at: ownerPayments[0]?.completed_at ?? ownerPayments[0]?.created_at ?? null,
      }
    })
  }, [owners.data, allotments.data, billing.data, payments.data])

  return { data, isPending, isError, error }
}

export interface LedgerPaymentRow {
  id: Uuid
  amount: number
  status: PaymentStatus
  gateway: GatewayType
  transaction_ref: string | null
  created_at: string
  completed_at: string | null
  office_owner_id: Uuid
  owner_name: string
  invoice_id: Uuid
  billing_cycle_key: string | null
  unit_code: string | null
}

export function useAllPayments() {
  return useQuery({
    queryKey: [...tenantKeys.all, 'all-payments'] as const,
    queryFn: async (): Promise<LedgerPaymentRow[]> => {
      const { data, error } = await supabase()
        .from('payment')
        .select(
          'id, amount, status, gateway, transaction_ref, created_at, completed_at, office_owner_id, invoice_id, office_owners(name), invoice(billing_cycle_key, office_unit(unit_code))',
        )
        .order('created_at', { ascending: false })
      if (error) throw dbError(error, 'Payments could not be loaded.')

      return (data ?? []).map((row) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        gateway: row.gateway,
        transaction_ref: row.transaction_ref,
        created_at: row.created_at,
        completed_at: row.completed_at,
        office_owner_id: row.office_owner_id,
        owner_name: row.office_owners?.name ?? '—',
        invoice_id: row.invoice_id,
        billing_cycle_key: row.invoice?.billing_cycle_key ?? null,
        unit_code: row.invoice?.office_unit?.unit_code ?? null,
      }))
    },
  })
}

export function useTenantPayments(ownerId: Uuid | null) {
  return useQuery({
    queryKey: tenantKeys.payments(ownerId),
    enabled: ownerId !== null,
    queryFn: async (): Promise<TenantPaymentRow[]> => {
      const { data, error } = await supabase()
        .from('payment')
        .select(
          'id, amount, status, gateway, transaction_ref, created_at, completed_at, invoice_id, invoice(billing_cycle_key, office_unit(unit_code))',
        )
        .eq('office_owner_id', ownerId as Uuid)
        .order('created_at', { ascending: false })
      if (error) throw dbError(error, 'Payments could not be loaded.')

      return (data ?? []).map((row) => ({
        id: row.id,
        amount: row.amount,
        status: row.status,
        gateway: row.gateway,
        transaction_ref: row.transaction_ref,
        created_at: row.created_at,
        completed_at: row.completed_at,
        invoice_id: row.invoice_id,
        billing_cycle_key: row.invoice?.billing_cycle_key ?? null,
        unit_code: row.invoice?.office_unit?.unit_code ?? null,
      }))
    },
  })
}

export function useTenantInvoices(ownerId: Uuid | null) {
  return useBillingReport({
    ...EMPTY_BILLING_FILTERS,
    officeOwnerId: ownerId,
  })
}

export function useTenantComplaints(ownerId: Uuid | null) {
  return useComplaints({
    ...EMPTY_COMPLAINT_FILTERS,
    officeOwnerId: ownerId,
  })
}

export function useTenantDocuments(ownerId: Uuid | null) {
  return useDocuments(ownerId)
}

export function useTenantAllotments(ownerId: Uuid | null) {
  return useAllotments({ status: null, ownerId })
}

// Keep ownerKeys exported for invalidation from deactivate flows that touch tenants.
export { ownerKeys }
