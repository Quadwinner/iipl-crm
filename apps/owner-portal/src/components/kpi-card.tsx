import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  loading?: boolean
  className?: string
}

export function KpiCard({ label, value, subtitle, icon: Icon, loading, className }: KpiCardProps) {
  return (
    <Card className={cn('py-4 shadow-sm', className)}>
      <CardContent className="flex items-start gap-3 px-4">
        {Icon ? (
          <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon aria-hidden="true" className="size-4" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="truncate font-mono text-xl leading-tight font-semibold tabular-nums">
              {value}
            </p>
          )}
          {subtitle ? <p className="text-muted-foreground truncate text-xs">{subtitle}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

interface KpiGridProps {
  children: React.ReactNode
  className?: string
}

export function KpiGrid({ children, className }: KpiGridProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</div>
  )
}
