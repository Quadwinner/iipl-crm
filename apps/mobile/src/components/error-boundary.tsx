import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { theme } from '../theme/theme'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  stack: string | null
}

/**
 * Without this, a render-time throw drops the whole app to Expo Go's generic
 * "Something went wrong" screen, which names neither the error nor where it came
 * from. Showing the message and component stack on-device turns a dead end into
 * something diagnosable — including on a phone with no USB cable attached.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, stack: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Also emit to Metro's terminal, which is where a developer is already looking.
    console.error('[itoby] render failed:', error?.message, info.componentStack)
    this.setState({ stack: info.componentStack ?? null })
  }

  render(): ReactNode {
    const { error, stack } = this.state
    if (!error) return this.props.children

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>The app hit an error</Text>
        <Text style={styles.message}>{error.message || String(error)}</Text>
        <ScrollView style={styles.stackBox}>
          <Text style={styles.stack}>{stack ?? error.stack ?? 'No stack available.'}</Text>
        </ScrollView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg, padding: theme.space(6), paddingTop: theme.space(16) },
  title: { color: theme.color.danger, fontSize: 20, fontWeight: '800', marginBottom: theme.space(3) },
  message: { color: theme.color.text, fontSize: 15, marginBottom: theme.space(5), lineHeight: 22 },
  stackBox: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.sm,
    padding: theme.space(3),
  },
  stack: { color: theme.color.muted, fontSize: 11, fontFamily: 'monospace' },
})
