import { useEffect } from 'react'

/**
 * Adds `.is-in` to every `.reveal` element once it scrolls into view, so the
 * CSS transition runs.
 *
 * `deps` matters: elements rendered after a query resolves do not exist when
 * the effect first runs, and an observer set up on mount would never see them —
 * they would stay at opacity 0 forever. Pass whatever gates their render.
 *
 * Falls back to revealing everything immediately where IntersectionObserver is
 * unavailable; content must never depend on the animation running.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-in)'))
    if (!nodes.length) return

    if (typeof IntersectionObserver === 'undefined') {
      for (const el of nodes) el.classList.add('is-in')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    )

    for (const el of nodes) io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
