import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  )
}

/** Whole-number setting with its unit spelled out, matching the server's bounds. */
export function NumberField({
  id,
  label,
  unit,
  min,
  error,
  registration,
}: {
  id: string
  label: string
  unit: string
  min: number
  error?: string
  registration: UseFormRegisterReturn
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          step="1"
          min={min}
          className="w-28"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        <span className="text-muted-foreground text-sm">{unit}</span>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
