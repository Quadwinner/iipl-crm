import type { ReactNode } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

/**
 * Loading, failure and empty for a CMS-backed section.
 *
 * Without it a failed query renders as an empty section — the page looks
 * finished and simply has nothing in it, which is indistinguishable from "we
 * publish no services" and gives the visitor nothing to act on. A failure says
 * so and offers a retry; content is only rendered once there is some.
 */
export function QueryState({
  isPending,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyHint,
  children,
}: {
  isPending: boolean
  error: unknown
  isEmpty: boolean
  onRetry: () => void
  emptyTitle: string
  emptyHint?: string
  children: ReactNode
}) {
  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sm text-[color:var(--fg-2)]">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span role="status">Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-24 text-center" role="alert">
        <p className="text-base font-semibold tracking-tight">That didn’t load</p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">
          Something went wrong fetching this section. It is usually temporary.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[color:var(--line)] px-4 py-2.5 text-sm font-semibold transition-colors hover:border-[color:var(--lime)]"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-base font-semibold tracking-tight">{emptyTitle}</p>
        {emptyHint ? (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">{emptyHint}</p>
        ) : null}
      </div>
    )
  }

  return <>{children}</>
}
