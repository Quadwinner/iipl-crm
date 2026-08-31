import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { useMyModules } from '@/features/modules/use-modules'
import { iconByName } from '@/lib/icons'

/**
 * Registered-but-not-built modules. Everything shown here — name, tagline,
 * summary, feature list — comes from the app_modules row, so flipping a module
 * to ACTIVE and giving it a base_path is a data change, not a code change.
 */
export function ModuleComingSoonPage() {
  const { moduleKey } = useParams<{ moduleKey: string }>()
  const modules = useMyModules()

  if (modules.isPending) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-4 h-32 w-full" />
      </main>
    )
  }

  const module = (modules.data ?? []).find((m) => m.key === moduleKey)

  if (!module) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-xl font-semibold tracking-tight">Product not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This product is not available on your account.
        </p>
        <Link to="/app" className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> All products
        </Link>
      </main>
    )
  }

  const Icon = iconByName(module.icon)
  const features = Array.isArray(module.features) ? (module.features as string[]) : []

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        to="/app"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" /> All products
      </Link>

      <div className="mt-6 flex items-start gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${module.accent}1a`, color: module.accent }}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{module.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{module.tagline}</p>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed">{module.summary}</p>

      {features.length ? (
        <ul className="mt-6 space-y-2">
          {features.map((f) => (
            <li key={f} className="text-muted-foreground flex gap-2.5 text-sm">
              <span className="bg-muted-foreground/40 mt-2 size-1 shrink-0 rounded-full" />
              {f}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="surface-card text-muted-foreground mt-8 p-4 text-sm">
        This product is not available on your account yet.
      </p>
    </main>
  )
}
