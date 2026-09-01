import { useEffect } from 'react'

/**
 * Adds `.in` to every `.rv` element once it scrolls into view so its CSS
 * transition runs.
 *
 * `deps` matters: sections that render only after a query resolves do not
 * exist when the effect first runs, and an observer set up on mount would
 * never see them — they would sit at opacity 0 forever. Pass whatever gates
 * their render.
 */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.rv:not(.in)'))
    if (!nodes.length) return

    if (typeof IntersectionObserver === 'undefined') {
      for (const el of nodes) el.classList.add('in')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    )
    for (const el of nodes) io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
