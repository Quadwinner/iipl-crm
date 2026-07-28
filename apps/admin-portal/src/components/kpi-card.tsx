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
  tone?: 'default' | 'warning' | 'success'
}

const toneStyles = {
  default: 'bg-primary/10 text-primary',
  warning: 'bg-destructive/10 text-destructive',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  loading,
  className,
  tone = 'default',
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        'group border-primary/10 bg-card/90 py-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <CardContent className="flex items-start gap-3 px-4">
        {Icon ? (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
              toneStyles[tone],
            )}
          >
            <Icon aria-hidden="true" className="size-[1.125rem]" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          <p className="section-label">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <p className="truncate font-mono text-xl leading-tight font-semibold tracking-tight tabular-nums sm:text-2xl">
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
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
  )
}
