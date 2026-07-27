import type { AllotmentStatus } from '@itoby/shared'
import { Badge } from '@/components/ui/badge'

const LABELS: Record<AllotmentStatus, string> = {
  ACTIVE: 'Active',
  TERMINATED: 'Terminated',
  EXPIRED: 'Expired',
}

export function AllotmentStatusBadge({ status }: { status: AllotmentStatus }) {
  return <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>{LABELS[status]}</Badge>
}

export function allotmentStatusLabel(status: AllotmentStatus): string {
  return LABELS[status]
}
