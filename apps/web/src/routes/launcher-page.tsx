import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { Skeleton } from '@itoby/ui'
import { useMyModules } from '@/features/modules/use-modules'
import { iconByName } from '@/lib/icons'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '',
  BETA: 'Beta',
  COMING_SOON: 'Coming soon',
  DISABLED: 'Unavailable',
}

/**
 * The launcher. Tiles come from modules_for_current_user(), so what a user sees
 * is decided by their role in the database — there is no client-side role
 * filtering here to get out of step with it.
 */
export function LauncherPage() {
  const { email } = useAuth()
  const modules = useMyModules()

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your products</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {email ? `Signed in as ${email}.` : ''} Open a product to get started.
        </p>
      </header>

      {modules.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : modules.error ? (
        <p role="alert" className="text-destructive text-sm">
          {(modules.error as Error).message}
        </p>
      ) : (modules.data ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No products are assigned to your account yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(modules.data ?? []).map((m) => {
            const Icon = iconByName(m.icon)
            const openable = (m.status === 'ACTIVE' || m.status === 'BETA') && !!m.base_path
            const badge = STATUS_LABELS[m.status] ?? ''
            const features = Array.isArray(m.features) ? (m.features as string[]) : []

            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${m.accent}1a`, color: m.accent }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {badge ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                      {badge}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex-1">
                  <h2 className="font-semibold tracking-tight">{m.name}</h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{m.tagline}</p>
                  {features.length ? (
                    <p className="text-muted-foreground/80 mt-3 line-clamp-2 text-xs leading-relaxed">
                      {features.slice(0, 2).join(' · ')}
                    </p>
                  ) : null}
                </div>

                {openable ? (
                  <span className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium">
                    Open <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="text-muted-foreground mt-4 text-sm">Not available yet</span>
                )}
              </>
            )

            const className =
              'surface-card flex min-h-44 flex-col p-5 transition-shadow ' +
              (openable ? 'hover:shadow-md' : 'opacity-75')

            return openable ? (
              <Link key={m.key} to={m.base_path!} className={className}>
                {body}
              </Link>
            ) : (
              <div key={m.key} className={className}>
                {body}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
