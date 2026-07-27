/**
 * Billing + occupancy report export (Task 25.6, Requirement 12.5).
 *
 * The export must reflect EXACTLY the on-screen figures for the active Building and date
 * range. To guarantee that, {@link fetchReportData} pulls from the very same RPCs the
 * dashboards use (`get_occupancy_dashboard`, `get_revenue_dashboard`) plus the billing
 * detail rows from `get_report_export`, which is itself restricted to the same
 * Building + date-range window. Both renderers ({@link reportToCsv}, {@link reportToPdf})
 * serialise that single in-memory snapshot, so CSV and PDF can never diverge from each
 * other or from the dashboard.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Database } from '../types/database.types'
import type { InvoiceStatus, IsoDate, Uuid } from '../types/domain'
import { type DateRange, DateRangeError, assertValidDateRange } from './date-range'
import {
  type OccupancyDashboard,
  type RevenueDashboard,
  ReportingError,
  getOccupancyDashboard,
  getRevenueDashboard,
} from './dashboard'

type DbClient = SupabaseClient<Database>

export type ExportFormat = 'csv' | 'pdf'

/** One billing detail row in the export, matching `get_report_export`. */
export interface BillingReportRow {
  invoiceId: Uuid
  officeOwnerId: Uuid
  ownerName: string
  officeUnitId: Uuid
  unitCode: string
  buildingId: Uuid
  buildingName: string
  billingCycleKey: string
  billingPeriodStart: IsoDate
  billingPeriodEnd: IsoDate
  totalAmount: number
  dueDate: IsoDate
  status: InvoiceStatus
}

/** The full filtered snapshot backing both the on-screen dashboard and the export. */
export interface ReportData {
  buildingId: Uuid | null
  range: DateRange
  occupancy: OccupancyDashboard
  revenue: RevenueDashboard
  billingRows: BillingReportRow[]
}

/** A rendered export ready to be offered as a download. */
export interface ExportedReport {
  fileName: string
  mimeType: string
  content: string | Uint8Array
}

/**
 * Fetches the occupancy, revenue, and billing-detail data for one Building/date-range
 * filter combination — the same queries the dashboards render — so any export built from
 * it matches the on-screen figures exactly (Requirement 12.5).
 */
export async function fetchReportData(
  client: DbClient,
  options: { range?: DateRange; buildingId?: Uuid } = {},
): Promise<ReportData> {
  const { buildingId } = options
  if (options.range) {
    assertValidDateRange(options.range)
  }

  const [occupancy, revenue] = await Promise.all([
    getOccupancyDashboard(client, buildingId),
    getRevenueDashboard(client, options.range, buildingId),
  ])

  const { data, error } = await client.rpc('get_report_export', {
    p_start_date: options.range?.startDate ?? undefined,
    p_end_date: options.range?.endDate ?? undefined,
    p_building_id: buildingId ?? undefined,
  })

  if (error) {
    if (error.code === '22023') {
      throw new DateRangeError(error.message)
    }
    throw new ReportingError(error.message)
  }

  const billingRows: BillingReportRow[] = (data ?? []).map((r) => ({
    invoiceId: r.invoice_id,
    officeOwnerId: r.office_owner_id,
    ownerName: r.owner_name,
    officeUnitId: r.office_unit_id,
    unitCode: r.unit_code,
    buildingId: r.building_id,
    buildingName: r.building_name,
    billingCycleKey: r.billing_cycle_key,
    billingPeriodStart: r.billing_period_start,
    billingPeriodEnd: r.billing_period_end,
    totalAmount: Number(r.total_amount),
    dueDate: r.due_date,
    status: r.status,
  }))

  // The effective range echoed back by the revenue dashboard is the source of truth,
  // covering the current-calendar-month default when no range was supplied.
  return {
    buildingId: buildingId ?? null,
    range: { startDate: revenue.rangeStart, endDate: revenue.rangeEnd },
    occupancy,
    revenue,
    billingRows,
  }
}

/** RFC 4180 field escaping: quote fields containing a comma, quote, CR, or LF. */
function csvField(value: string | number): string {
  const s = String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(fields: Array<string | number>): string {
  return fields.map(csvField).join(',')
}

const BILLING_HEADER = [
  'Invoice ID',
  'Building',
  'Unit',
  'Owner',
  'Billing Cycle',
  'Period Start',
  'Period End',
  'Total Amount',
  'Due Date',
  'Status',
] as const

/**
 * Serialises the report snapshot to CSV: an occupancy + revenue summary block followed
 * by the billing detail rows. Pure — deterministic for a given {@link ReportData}.
 */
export function reportToCsv(data: ReportData): string {
  const lines: string[] = []

  lines.push(csvRow(['Report', 'Occupancy & Billing']))
  lines.push(csvRow(['Building', data.buildingId ?? 'All buildings']))
  lines.push(csvRow(['Date Range', `${data.range.startDate} to ${data.range.endDate}`]))
  lines.push('')

  lines.push(csvRow(['Occupancy Summary']))
  lines.push(csvRow(['Total Units', data.occupancy.totalUnits]))
  lines.push(csvRow(['Occupied', data.occupancy.occupiedCount]))
  lines.push(csvRow(['Vacant', data.occupancy.vacantCount]))
  lines.push(csvRow(['Occupancy Rate (%)', data.occupancy.occupancyRatePercent]))
  lines.push('')

  lines.push(csvRow(['Revenue Summary']))
  lines.push(csvRow(['Total Rent Collected', data.revenue.totalRentCollected.toFixed(2)]))
  lines.push(csvRow(['Total Outstanding Dues', data.revenue.totalOutstandingDues.toFixed(2)]))
  lines.push(csvRow(['Overdue Invoice Count', data.revenue.overdueInvoiceCount]))
  lines.push('')

  lines.push(csvRow(['Billing Detail']))
  lines.push(csvRow([...BILLING_HEADER]))
  for (const row of data.billingRows) {
    lines.push(
      csvRow([
        row.invoiceId,
        row.buildingName,
        row.unitCode,
        row.ownerName,
        row.billingCycleKey,
        row.billingPeriodStart,
        row.billingPeriodEnd,
        row.totalAmount.toFixed(2),
        row.dueDate,
        row.status,
      ]),
    )
  }

  return lines.join('\r\n')
}

/**
 * Renders the same report snapshot to a single-page-per-overflow PDF using the shared
 * pdf-lib renderer (also used by the receipt Edge Function). Returns the PDF bytes.
 */
export async function reportToPdf(data: ReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.1, 0.1, 0.12)

  const pageWidth = 595
  const pageHeight = 842
  const marginX = 50
  const bottomMargin = 50

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 60

  const newLineHeight = 20

  const ensureSpace = (needed: number) => {
    if (y - needed < bottomMargin) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - 60
    }
  }

  const drawLine = (text: string, size = 11, useBold = false) => {
    ensureSpace(newLineHeight)
    page.drawText(text, { x: marginX, y, size, font: useBold ? bold : font, color: ink })
    y -= newLineHeight
  }

  drawLine('Occupancy & Billing Report', 20, true)
  y -= 6
  drawLine(`Building: ${data.buildingId ?? 'All buildings'}`)
  drawLine(`Date Range: ${data.range.startDate} to ${data.range.endDate}`)
  y -= 10

  drawLine('Occupancy Summary', 14, true)
  drawLine(`Total Units: ${data.occupancy.totalUnits}`)
  drawLine(`Occupied: ${data.occupancy.occupiedCount}`)
  drawLine(`Vacant: ${data.occupancy.vacantCount}`)
  drawLine(`Occupancy Rate: ${data.occupancy.occupancyRatePercent}%`)
  y -= 10

  drawLine('Revenue Summary', 14, true)
  drawLine(`Total Rent Collected: ${data.revenue.totalRentCollected.toFixed(2)}`)
  drawLine(`Total Outstanding Dues: ${data.revenue.totalOutstandingDues.toFixed(2)}`)
  drawLine(`Overdue Invoices: ${data.revenue.overdueInvoiceCount}`)
  y -= 10

  drawLine('Billing Detail', 14, true)
  if (data.billingRows.length === 0) {
    drawLine('No invoices for the selected filters.')
  }
  for (const row of data.billingRows) {
    drawLine(
      `${row.buildingName} / ${row.unitCode} | ${row.ownerName} | ${row.billingCycleKey} | ` +
        `${row.totalAmount.toFixed(2)} | due ${row.dueDate} | ${row.status}`,
    )
  }

  return await doc.save()
}

function fileStamp(range: DateRange): string {
  return `${range.startDate}_to_${range.endDate}`
}

/**
 * Exports the billing + occupancy report for the active filters in CSV or PDF. Both
 * formats are built from one {@link fetchReportData} snapshot, so the export always
 * reflects exactly the on-screen Building and date-range selection (Requirement 12.5).
 */
export async function exportReport(
  client: DbClient,
  options: { range?: DateRange; buildingId?: Uuid; format: ExportFormat },
): Promise<ExportedReport> {
  const data = await fetchReportData(client, {
    range: options.range,
    buildingId: options.buildingId,
  })

  const stamp = fileStamp(data.range)

  if (options.format === 'csv') {
    return {
      fileName: `report_${stamp}.csv`,
      mimeType: 'text/csv',
      content: reportToCsv(data),
    }
  }

  return {
    fileName: `report_${stamp}.pdf`,
    mimeType: 'application/pdf',
    content: await reportToPdf(data),
  }
}
