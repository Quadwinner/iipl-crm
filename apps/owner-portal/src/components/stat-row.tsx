import { Skeleton } from '@/components/ui/skeleton'

export interface StatItem {
  label: string
  value: string
}

export function StatRow({ items, loading }: { items: StatItem[]; loading?: boolean }) {
  return (
    <dl className="divide-border flex flex-wrap items-stretch divide-x">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-36 flex-col gap-0.5 pr-6 first:pl-0 [&:not(:first-child)]:pl-6"
        >
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="font-mono text-xl leading-tight tabular-nums">
            {loading ? <Skeleton className="h-6 w-24" /> : item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
