import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="surface-card flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
      <div className="space-y-2">
        <div className="bg-primary h-1 w-10 rounded-full" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.65rem]">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
