import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@itoby/ui'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Without this, a render-time throw anywhere unmounts the whole tree and leaves
 * a blank white page — no message, no way back, and nothing in the UI to say
 * what happened.
 *
 * It deliberately does not try to recover the failed subtree: React cannot
 * guarantee the state that produced the throw is gone. Reloading is the honest
 * offer, and the error text is shown rather than hidden so a report of "it broke"
 * arrives with something actionable in it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[itoby] render failed:', error.message, info.componentStack)
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Something broke</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This page hit an error it could not recover from. Reloading usually clears it; if it
            keeps happening, the message below is the useful part to report.
          </p>
          <pre className="bg-muted max-h-56 overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap">
            {error.message || String(error)}
          </pre>
          <Button onClick={() => window.location.reload()}>Reload the page</Button>
        </div>
      </main>
    )
  }
}
