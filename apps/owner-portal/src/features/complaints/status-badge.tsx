import type { ComplaintStatus } from '@itoby/shared'
import { Badge } from '@itoby/ui'

const LABELS: Record<ComplaintStatus, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
}

const VARIANTS: Record<ComplaintStatus, 'secondary' | 'outline'> = {
  OPEN: 'outline',
  ASSIGNED: 'outline',
  IN_PROGRESS: 'outline',
  RESOLVED: 'secondary',
}

export function complaintStatusLabel(status: ComplaintStatus): string {
  return LABELS[status]
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge variant={VARIANTS[status]} className="font-normal">
      {LABELS[status]}
    </Badge>
  )
}
