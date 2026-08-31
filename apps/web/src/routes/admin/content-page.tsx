import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  useCmsIndustries,
  useCmsServices,
  useCmsSettings,
  useTogglePublished,
  useUpdateSiteSettings,
} from '@/features/cms/api'

const FIELDS = [
  { key: 'company_name', label: 'Company name' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'address', label: 'Address' },
  { key: 'business_hours', label: 'Business hours' },
] as const

function SiteSettingsForm() {
  const settings = useCmsSettings()
  const update = useUpdateSiteSettings()
  const [form, setForm] = useState<Record<string, string>>({})
  const seeded = useRef(false)

  // Seed once. Re-seeding on every refetch (a save invalidates this query)
  // would overwrite whatever the user has since typed.
  useEffect(() => {
    if (!settings.data || seeded.current) return
    const next: Record<string, string> = { intro: settings.data.intro }
    for (const f of FIELDS) next[f.key] = String(settings.data[f.key] ?? '')
    setForm(next)
    seeded.current = true
  }, [settings.data])

  if (settings.isPending) return <Skeleton className="h-96 w-full rounded-xl" />

  function save(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form, {
      onSuccess: () => toast.success('Site updated — the public site reflects this immediately.'),
      onError: (err) => toast.error((err as Error).message),
    })
  }

  return (
    <form onSubmit={save} className="surface-card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input
              id={f.key}
              className="bg-background"
              value={form[f.key] ?? ''}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="intro">Intro</Label>
        <Textarea
          id="intro"
          rows={4}
          className="bg-background"
          value={form.intro ?? ''}
          onChange={(e) => setForm((s) => ({ ...s, intro: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

function PublishList({
  title,
  rows,
  table,
  labelOf,
}: {
  title: string
  rows: { id: string; is_published: boolean }[] | undefined
  table: 'service_offerings' | 'industries'
  labelOf: (r: never) => string
}) {
  const toggle = useTogglePublished(table)
  if (!rows) return <Skeleton className="h-48 w-full rounded-xl" />
  return (
    <section className="surface-card p-5">
      <h2 className="mb-3 font-semibold tracking-tight">{title}</h2>
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="text-sm">{labelOf(r as never)}</span>
            <Button
              size="sm"
              variant={r.is_published ? 'outline' : 'default'}
              disabled={toggle.isPending}
              onClick={() =>
                toggle.mutate(
                  { id: r.id, is_published: !r.is_published },
                  { onError: (e) => toast.error((e as Error).message) },
                )
              }
            >
              {r.is_published ? 'Published' : 'Hidden'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Content CMS. Every field here is what the public site renders — changing the
 * site_settings row changes the site with no redeploy, because the public pages
 * read it through useSiteSettings() rather than hardcoding copy.
 */
export function ContentPage() {
  const services = useCmsServices()
  const industries = useCmsIndustries()

  return (
    <main id="main" className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Site content</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Company details, services and industries shown on the public site.
        </p>
      </header>

      <SiteSettingsForm />

      <div className="grid gap-6 lg:grid-cols-2">
        <PublishList
          title="Services"
          rows={services.data}
          table="service_offerings"
          labelOf={(r: { title: string }) => r.title}
        />
        <PublishList
          title="Industries"
          rows={industries.data}
          table="industries"
          labelOf={(r: { name: string }) => r.name}
        />
      </div>
    </main>
  )
}
