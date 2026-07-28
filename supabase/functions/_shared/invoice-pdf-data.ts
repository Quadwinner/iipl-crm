/**
 * Loads invoice + company profile data for GST PDF rendering.
 */

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import {
  type GstCompanyProfile,
  type GstInvoiceInput,
  type GstInvoiceLineItem,
  type GstPaymentNote,
} from '../_shared/gst-invoice-pdf.ts'

interface InvoiceRow {
  id: string
  invoice_number: string | null
  document_ref: string | null
  office_owner_id: string
  due_date: string
  created_at: string
  rent_amount: number
  electricity_amount: number | null
  electricity_units: number | null
  electricity_note: string | null
  maintenance_amount: number | null
  maintenance_note: string | null
  additional_charges: number
  total_amount: number
  billing_cycle_key: string
  billing_period_start: string
  billing_period_end: string
  office_owners: {
    name: string
    company_name: string | null
    gstin: string | null
    phone: string
    billing_address: string | null
  } | null
  office_unit: {
    unit_code: string
    building: { name: string; address: string } | null
  } | null
}

interface GlobalConfigRow {
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
  default_gst_rate_percent: number
  default_hsn_sac: string
}

export async function loadGstInvoiceInput(
  serviceClient: SupabaseClient,
  invoiceId: string,
  paymentNote?: GstPaymentNote | null,
): Promise<{ invoiceId: string; ownerId: string; documentRef: string | null; input: GstInvoiceInput }> {
  const { data: config, error: configError } = await serviceClient
    .from('global_config')
    .select(
      'company_legal_name, company_gstin, company_address, company_phone, company_email, company_place_of_supply, bank_name, bank_account_number, bank_ifsc, bank_branch, default_gst_rate_percent, default_hsn_sac',
    )
    .eq('id', 1)
    .single()

  if (configError || !config) {
    throw new Error('Company billing profile could not be loaded')
  }

  const { data: invoice, error: invoiceError } = await serviceClient
    .from('invoice')
    .select(
      `id, invoice_number, document_ref, office_owner_id, due_date, created_at,
       rent_amount, electricity_amount, electricity_units, electricity_note,
       maintenance_amount, maintenance_note, additional_charges, total_amount,
       billing_cycle_key, billing_period_start, billing_period_end,
       office_owners(name, company_name, gstin, phone, billing_address),
       office_unit(unit_code, building(name, address))`,
    )
    .eq('id', invoiceId)
    .maybeSingle()

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found')
  }

  const row = invoice as unknown as InvoiceRow
  const cfg = config as GlobalConfigRow

  let invoiceNumber = row.invoice_number
  if (!invoiceNumber) {
    const { data: assigned, error: assignError } = await serviceClient.rpc('assign_invoice_number', {
      p_invoice_id: invoiceId,
    })
    if (assignError) throw new Error(assignError.message)
    invoiceNumber = assigned as string
  }

  const building = row.office_unit?.building
  const unitCode = row.office_unit?.unit_code ?? '—'
  const shippingAddress = building
    ? `${building.name}, Unit ${unitCode}, ${building.address}`
    : `Unit ${unitCode}`

  const customerName = row.office_owners?.company_name?.trim() || row.office_owners?.name || 'Tenant'
  const customerAddress =
    row.office_owners?.billing_address?.trim() || building?.address || shippingAddress

  const company: GstCompanyProfile = {
    legalName: cfg.company_legal_name,
    gstin: cfg.company_gstin,
    address: cfg.company_address,
    phone: cfg.company_phone,
    email: cfg.company_email,
    placeOfSupply: cfg.company_place_of_supply,
    bankName: cfg.bank_name,
    bankAccountNumber: cfg.bank_account_number,
    bankIfsc: cfg.bank_ifsc,
    bankBranch: cfg.bank_branch,
  }

  const hsnRent = cfg.default_hsn_sac
  const lineItems: GstInvoiceLineItem[] = []

  if (Number(row.rent_amount) > 0) {
    lineItems.push({
      description: `OFFICE RENT-${unitCode}`,
      hsnSac: hsnRent,
      rate: Number(row.rent_amount),
      qty: 1,
      qtyLabel: '1 QTY',
    })
  }

  if (Number(row.electricity_amount ?? 0) > 0) {
    const units = row.electricity_units
    lineItems.push({
      description: units
        ? `ELECTRICITY CHARGES (${units} units)`
        : 'ELECTRICITY CHARGES',
      hsnSac: '995419',
      rate: Number(row.electricity_amount),
      qty: 1,
      qtyLabel: '1 QTY',
    })
  }

  if (Number(row.maintenance_amount ?? 0) > 0) {
    lineItems.push({
      description: row.maintenance_note?.trim()
        ? `MAINTENANCE — ${row.maintenance_note.trim()}`
        : 'MAINTENANCE FEE',
      hsnSac: '999599',
      rate: Number(row.maintenance_amount),
      qty: 1,
      qtyLabel: '1 QTY',
    })
  }

  if (Number(row.additional_charges) > 0) {
    lineItems.push({
      description: 'OTHER CHARGES',
      hsnSac: '999599',
      rate: Number(row.additional_charges),
      qty: 1,
      qtyLabel: '1 QTY',
    })
  }

  if (lineItems.length === 0) {
    lineItems.push({
      description: `OFFICE RENT-${unitCode}`,
      hsnSac: hsnRent,
      rate: Number(row.total_amount),
      qty: 1,
      qtyLabel: '1 QTY',
    })
  }

  const input: GstInvoiceInput = {
    company,
    invoiceNumber,
    invoiceDate: row.created_at.slice(0, 10),
    dueDate: row.due_date,
    customerName,
    customerGstin: row.office_owners?.gstin,
    customerAddress,
    customerPhone: row.office_owners?.phone ?? '—',
    shippingAddress,
    lineItems,
    gstRatePercent: Number(cfg.default_gst_rate_percent),
    paymentNote: paymentNote ?? null,
  }

  return {
    invoiceId: row.id,
    ownerId: row.office_owner_id,
    documentRef: row.document_ref,
    input,
  }
}
