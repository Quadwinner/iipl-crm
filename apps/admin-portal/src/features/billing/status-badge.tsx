import type { InvoiceStatus } from '@itoby/shared'
import { Badge } from '@/components/ui/badge'

const LABELS: Record<InvoiceStatus, string> = {
  DUE: 'Due',
  PARTIALLY_PAID: 'Partially paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

const VARIANTS: Record<InvoiceStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
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
