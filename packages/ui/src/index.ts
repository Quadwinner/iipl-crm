/**
 * @itoby/ui — the IIPL/Itoby component library.
 *
 * Single source of truth for the shadcn-based primitives every app shares.
 * Previously these lived as per-app copies; edit here, not in an app.
 */

export * from './components/alert-dialog'
export * from './components/avatar'
export * from './components/badge'
export * from './components/button'
export * from './components/card'
export * from './components/dialog'
export * from './components/empty'
export * from './components/input'
export * from './components/label'
export * from './components/select'
export * from './components/separator'
export * from './components/sheet'
export * from './components/skeleton'
export * from './components/sonner'
export * from './components/table'
export * from './components/tabs'
export * from './components/textarea'

export { cn } from './lib/utils'
export { unlockBodyScroll } from './lib/scroll-lock'
export { openSignedFile } from './lib/open-signed-file'
