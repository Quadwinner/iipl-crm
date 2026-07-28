/**
 * GST Tax Invoice PDF renderer — matches IIPL / Indian GST invoice layout.
 * Uses StandardFonts (WinAnsi) only; amounts shown as Rs. X,XXX.00
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1'

const ink = rgb(0.1, 0.1, 0.1)
const muted = rgb(0.35, 0.35, 0.38)
const line = rgb(0.55, 0.55, 0.58)
const headerBlue = rgb(0.12, 0.28, 0.55)
const white = rgb(1, 1, 1)

export interface GstCompanyProfile {
  legalName: string
  gstin: string
  address: string
  phone: string
  email: string
  placeOfSupply: string
  bankName: string
  bankAccountNumber: string
  bankIfsc: string
  bankBranch: string
}

export interface GstInvoiceLineItem {
  description: string
  hsnSac: string
  rate: number
  qty: number
  qtyLabel?: string
}

export interface GstPaymentNote {
  amount: number
  gateway: string
  transactionRef: string | null
  paidAt: string
}

export interface GstInvoiceInput {
  company: GstCompanyProfile
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  customerName: string
  customerGstin?: string | null
  customerAddress: string
  customerPhone: string
  shippingAddress: string
  lineItems: GstInvoiceLineItem[]
  gstRatePercent: number
  paymentNote?: GstPaymentNote | null
}

export function pdfSafeText(text: string): string {
  return text
    .replace(/\u20B9/g, 'Rs.')
    .replace(/\u202f/g, ',')
    .replace(/\u00a0/g, ' ')
}

function formatInr(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `Rs. ${formatted}`
}

function formatInrPlain(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDateOnly(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = ink,
  maxWidth?: number,
) {
  let content = pdfSafeText(text)
  if (maxWidth) {
    while (content.length > 0 && font.widthOfTextAtSize(content, size) > maxWidth) {
      content = content.slice(0, -1)
    }
    if (content !== pdfSafeText(text) && content.length > 3) content = `${content.slice(0, -3)}...`
  }
  page.drawText(content, { x, y, size, font, color })
}

function drawRightText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color = ink,
) {
  const safe = pdfSafeText(text)
  const width = font.widthOfTextAtSize(safe, size)
  page.drawText(safe, { x: rightX - width, y, size, font, color })
}

function drawBox(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: line, borderWidth: 0.75 })
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = pdfSafeText(text).split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

const BELOW_TWENTY = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigitWords(n: number): string {
  if (n < 20) return BELOW_TWENTY[n] ?? ''
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return ones === 0 ? (TENS[tens] ?? '') : `${TENS[tens]} ${BELOW_TWENTY[ones]}`.trim()
}

function chunkWords(n: number): string {
  if (n === 0) return ''
  if (n < 100) return twoDigitWords(n)
  if (n < 1000) {
    const hundreds = Math.floor(n / 100)
    const rest = n % 100
    return rest === 0
      ? `${BELOW_TWENTY[hundreds]} Hundred`
      : `${BELOW_TWENTY[hundreds]} Hundred ${twoDigitWords(rest)}`
  }
  return ''
}

function inrAmountInWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  if (rupees === 0 && paise === 0) return 'Zero Rupees Only'

  const crore = Math.floor(rupees / 10000000)
  const lakh = Math.floor((rupees % 10000000) / 100000)
  const thousand = Math.floor((rupees % 100000) / 1000)
  const hundredPart = rupees % 1000

  const parts: string[] = []
  if (crore > 0) parts.push(`${chunkWords(crore)} Crore`)
  if (lakh > 0) parts.push(`${chunkWords(lakh)} Lakh`)
  if (thousand > 0) parts.push(`${chunkWords(thousand)} Thousand`)
  if (hundredPart > 0) parts.push(chunkWords(hundredPart))

  let words = parts.join(' ').replace(/\s+/g, ' ').trim()
  words = `${words} Rupee${rupees === 1 ? '' : 's'}`
  if (paise > 0) words += ` And ${twoDigitWords(paise)} Paise`
  return `${words} Only`
}

export async function renderGstInvoicePdf(input: GstInvoiceInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const margin = 28
  const pageW = 595
  const contentW = pageW - margin * 2
  let y = 814

  const gstRate = input.gstRatePercent
  const halfRate = gstRate / 2

  const computedLines = input.lineItems.map((item) => {
    const taxable = Math.round(item.rate * item.qty * 100) / 100
    const taxAmount = Math.round(taxable * (gstRate / 100) * 100) / 100
    const total = Math.round((taxable + taxAmount) * 100) / 100
    return { ...item, taxable, taxAmount, total }
  })

  const taxableTotal = computedLines.reduce((sum, row) => sum + row.taxable, 0)
  const taxTotal = computedLines.reduce((sum, row) => sum + row.taxAmount, 0)
  const grandTotal = Math.round((taxableTotal + taxTotal) * 100) / 100
  const cgst = Math.round(taxTotal / 2 * 100) / 100
  const sgst = Math.round((taxTotal - cgst) * 100) / 100

  // Outer border
  drawBox(page, margin, 56, contentW, y - 56 + 4)

  // Title row
  drawText(page, 'TAX INVOICE', margin + contentW / 2 - 42, y - 18, 14, bold, headerBlue)
  drawRightText(page, 'ORIGINAL FOR RECIPIENT', margin + contentW - 8, y - 18, 8, font, muted)
  y -= 28

  const leftW = contentW * 0.55
  const rightW = contentW - leftW
  const headerH = 108

  drawBox(page, margin, y - headerH, leftW, headerH)
  drawBox(page, margin + leftW, y - headerH, rightW, headerH)

  let hy = y - 16
  drawText(page, input.company.legalName, margin + 8, hy, 11, bold, ink, leftW - 16)
  hy -= 14
  drawText(page, `GSTIN: ${input.company.gstin}`, margin + 8, hy, 8, font, muted, leftW - 16)
  hy -= 12
  for (const lineText of wrapLines(input.company.address, font, 8, leftW - 16)) {
    drawText(page, lineText, margin + 8, hy, 8, font, ink)
    hy -= 10
  }
  hy -= 2
  drawText(page, `Mobile: ${input.company.phone}`, margin + 8, hy, 8, font, ink)
  hy -= 10
  drawText(page, `Email: ${input.company.email}`, margin + 8, hy, 8, font, ink)

  const rx = margin + leftW + 8
  let ry = y - 16
  const meta: Array<[string, string]> = [
    ['Invoice #', input.invoiceNumber],
    ['Invoice Date', formatDateOnly(input.invoiceDate)],
    ['Place of Supply', input.company.placeOfSupply],
    ['Due Date', formatDateOnly(input.dueDate)],
  ]
  for (const [label, value] of meta) {
    drawText(page, label, rx, ry, 8, font, muted)
    drawText(page, value, rx + 88, ry, 8, bold, ink, rightW - 100)
    ry -= 14
  }
  drawText(page, 'Shipping Address', rx, ry, 8, font, muted)
  ry -= 11
  for (const lineText of wrapLines(input.shippingAddress, font, 7.5, rightW - 16).slice(0, 3)) {
    drawText(page, lineText, rx, ry, 7.5, font, ink)
    ry -= 9
  }

  y -= headerH

  // Customer row
  const partyH = 72
  drawBox(page, margin, y - partyH, contentW / 2, partyH)
  drawBox(page, margin + contentW / 2, y - partyH, contentW / 2, partyH)

  drawText(page, 'Customer Details', margin + 8, y - 14, 8, bold, ink)
  let cy = y - 28
  drawText(page, 'Customer Name:', margin + 8, cy, 8, font, muted)
  drawText(page, input.customerName, margin + 88, cy, 8, bold, ink, contentW / 2 - 96)
  cy -= 12
  if (input.customerGstin) {
    drawText(page, 'GSTIN:', margin + 8, cy, 8, font, muted)
    drawText(page, input.customerGstin, margin + 88, cy, 8, font, ink)
    cy -= 12
  }
  drawText(page, 'Billing Address:', margin + 8, cy, 8, font, muted)
  cy -= 10
  for (const lineText of wrapLines(input.customerAddress, font, 7.5, contentW / 2 - 16).slice(0, 2)) {
    drawText(page, lineText, margin + 8, cy, 7.5, font, ink)
    cy -= 9
  }
  drawText(page, `Phone: ${input.customerPhone}`, margin + 8, y - partyH + 10, 8, font, ink)

  drawText(page, 'Shipping Address', margin + contentW / 2 + 8, y - 14, 8, bold, ink)
  let sy = y - 28
  for (const lineText of wrapLines(input.shippingAddress, font, 8, contentW / 2 - 16)) {
    drawText(page, lineText, margin + contentW / 2 + 8, sy, 8, font, ink)
    sy -= 10
  }

  y -= partyH

  // Items table
  const cols = [24, 148, 52, 58, 36, 68, 72, 68]
  const headers = ['#', 'Item', 'HSN/SAC', 'Rate / Item', 'Qty', 'Taxable Value', 'Tax Amount', 'Amount']
  const tableX = margin
  const rowH = 22
  const headerRowH = 24

  drawBox(page, tableX, y - headerRowH, contentW, headerRowH)
  let cx = tableX
  for (let i = 0; i < headers.length; i++) {
    if (i > 0) {
      page.drawLine({
        start: { x: cx, y: y },
        end: { x: cx, y: y - headerRowH },
        thickness: 0.75,
        color: line,
      })
    }
    const alignRight = i >= 3
    const label = headers[i] ?? ''
    if (alignRight) {
      drawRightText(page, label, cx + cols[i]! - 4, y - 15, 7, bold, ink)
    } else {
      drawText(page, label, cx + 4, y - 15, 7, bold, ink)
    }
    cx += cols[i]!
  }

  y -= headerRowH
  computedLines.forEach((row, index) => {
    drawBox(page, tableX, y - rowH, contentW, rowH)
    cx = tableX
    const cells = [
      String(index + 1),
      row.description,
      row.hsnSac,
      formatInrPlain(row.rate),
      row.qtyLabel ?? `${row.qty} QTY`,
      formatInrPlain(row.taxable),
      `${formatInrPlain(row.taxAmount)} (${gstRate}%)`,
      formatInrPlain(row.total),
    ]
    for (let i = 0; i < cells.length; i++) {
      if (i > 0) {
        page.drawLine({
          start: { x: cx, y: y },
          end: { x: cx, y: y - rowH },
          thickness: 0.75,
          color: line,
        })
      }
      const cell = cells[i] ?? ''
      if (i >= 3) {
        drawRightText(page, cell, cx + cols[i]! - 4, y - 14, 7.5, i === 1 ? bold : font, ink)
      } else {
        drawText(page, cell, cx + 4, y - 14, 7.5, i === 1 ? bold : font, ink, cols[i]! - 8)
      }
      cx += cols[i]!
    }
    y -= rowH
  })

  const summaryH = 88
  drawBox(page, margin, y - summaryH, contentW, summaryH)
  drawText(
    page,
    `Total items / Qty : ${computedLines.length} / ${computedLines.reduce((s, r) => s + r.qty, 0)}`,
    margin + 8,
    y - 16,
    8,
    font,
    muted,
  )

  const sumX = margin + contentW - 200
  let sumY = y - 16
  const summaryRows: Array<[string, string, boolean]> = [
    ['Taxable Amount', formatInrPlain(taxableTotal), false],
    [`CGST ${halfRate}%`, formatInrPlain(cgst), false],
    [`SGST ${halfRate}%`, formatInrPlain(sgst), false],
    ['Total', formatInrPlain(grandTotal), true],
  ]
  for (const [label, value, isTotal] of summaryRows) {
    drawText(page, label, sumX, sumY, isTotal ? 9 : 8, isTotal ? bold : font, isTotal ? ink : muted)
    drawRightText(page, value, margin + contentW - 8, sumY, isTotal ? 11 : 8, isTotal ? bold : font, ink)
    sumY -= isTotal ? 16 : 12
  }

  y -= summaryH

  const wordsH = 28
  drawBox(page, margin, y - wordsH, contentW, wordsH)
  drawText(page, 'Total amount (in words):', margin + 8, y - 12, 8, font, muted)
  drawText(
    page,
    `INR ${inrAmountInWords(grandTotal)}`,
    margin + 8,
    y - 24,
    8,
    bold,
    ink,
    contentW - 16,
  )
  y -= wordsH

  // HSN breakdown
  const gstTableH = 54
  drawBox(page, margin, y - gstTableH, contentW, gstTableH)
  const gstCols = [80, 90, 70, 70, 70, 70, contentW - 380]
  const gstHeaders = [
    'HSN/SAC',
    'Taxable Value',
    'Central Tax Rate',
    'Central Tax Amt',
    'State Tax Rate',
    'State Tax Amt',
    'Total Tax',
  ]
  cx = margin
  for (let i = 0; i < gstHeaders.length; i++) {
    if (i > 0) {
      page.drawLine({
        start: { x: cx, y: y },
        end: { x: cx, y: y - gstTableH },
        thickness: 0.75,
        color: line,
      })
    }
    drawText(page, gstHeaders[i] ?? '', cx + 3, y - 12, 6.5, bold, ink, gstCols[i]! - 6)
    cx += gstCols[i]!
  }
  page.drawLine({
    start: { x: margin, y: y - 20 },
    end: { x: margin + contentW, y: y - 20 },
    thickness: 0.75,
    color: line,
  })

  const primaryHsn = computedLines[0]?.hsnSac ?? '997212'
  cx = margin
  const gstCells = [
    primaryHsn,
    formatInrPlain(taxableTotal),
    `${halfRate}%`,
    formatInrPlain(cgst),
    `${halfRate}%`,
    formatInrPlain(sgst),
    formatInrPlain(taxTotal),
  ]
  for (let i = 0; i < gstCells.length; i++) {
    drawText(page, gstCells[i] ?? '', cx + 3, y - 36, 7.5, font, ink, gstCols[i]! - 6)
    cx += gstCols[i]!
  }
  y -= gstTableH

  // Bank + signature
  const footerH = 78
  drawBox(page, margin, y - footerH, contentW / 2, footerH)
  drawBox(page, margin + contentW / 2, y - footerH, contentW / 2, footerH)

  drawText(page, 'Bank Details:', margin + 8, y - 14, 8, bold, ink)
  let by = y - 28
  const bankLines = [
    `Bank: ${input.company.bankName}`,
    `Account #: ${input.company.bankAccountNumber}`,
    `IFSC Code: ${input.company.bankIfsc}`,
    `Branch: ${input.company.bankBranch}`,
  ]
  for (const bl of bankLines) {
    drawText(page, bl, margin + 8, by, 8, font, ink)
    by -= 11
  }

  drawRightText(
    page,
    `For ${input.company.legalName}`,
    margin + contentW - 8,
    y - 18,
    8,
    font,
    ink,
  )
  drawRightText(page, 'Authorized Signatory', margin + contentW - 8, y - footerH + 12, 8, font, muted)

  if (input.paymentNote) {
    drawText(
      page,
      `Payment received: ${formatInr(input.paymentNote.amount)} via ${input.paymentNote.gateway}` +
        (input.paymentNote.transactionRef ? ` (Ref: ${input.paymentNote.transactionRef})` : '') +
        ` on ${formatDateOnly(input.paymentNote.paidAt)}`,
      margin + 8,
      68,
      7.5,
      font,
      headerBlue,
      contentW - 16,
    )
  }

  drawText(page, 'This is a digitally generated tax invoice.', margin + 8, 44, 7, font, muted)
  drawRightText(page, 'Page 1/1', margin + contentW - 8, 44, 7, font, muted)

  return await doc.save()
}
