import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { cn } from '@rental-admin/lib/utils'

interface DataToolbarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  clearable?: boolean
  onClear?: () => void
  className?: string
}

export function DataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  clearable,
  onClear,
  className,
}: DataToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {onSearchChange ? (
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            value={search ?? ''}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}
      {filters}
      {clearable && onClear ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <X aria-hidden="true" />
          Clear
        </Button>
      ) : null}
    </div>
  )
}
