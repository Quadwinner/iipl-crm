import type { ReactNode } from 'react'

import { Separator } from '@rental-owner/components/ui/separator'

export function ScreenHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>
      <Separator className="mt-4" />
    </div>
  )
}
