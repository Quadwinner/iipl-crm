import { cn } from '@/lib/utils'

export interface StatusTabOption<T extends string> {
  value: T | 'ALL'
  label: string
  count?: number
}

interface StatusTabsProps<T extends string> {
  options: readonly StatusTabOption<T>[]
  value: T | 'ALL'
  onChange: (value: T | 'ALL') => void
  className?: string
}

export function StatusTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: StatusTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="Status filter"
      className={cn('bg-muted inline-flex max-w-full flex-wrap gap-1 rounded-lg p-1', className)}
    >
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]',
              selected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums',
                  selected ? 'bg-muted' : 'bg-background/60',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
