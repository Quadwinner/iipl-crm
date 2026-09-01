import type { InvoiceStatus } from '@itoby/shared'
import { Badge } from '@itoby/ui'

const LABELS: Record<InvoiceStatus, string> = {
  DUE: 'Due',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

/** Only Overdue is given the destructive tone; the rest stay quiet. */
const VARIANTS: Record<InvoiceStatus, 'secondary' | 'outline' | 'destructive'> = {
  DUE: 'outline',
  PARTIALLY_PAID: 'outline',
  PAID: 'secondary',
  OVERDUE: 'destructive',
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  return LABELS[status]
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant={VARIANTS[status]} className="font-normal">
      {LABELS[status]}
    </Badge>
  )
}
