import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class CoreErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
          <div className="max-w-2xl w-full card border-danger/30 bg-danger/5">
            <h2 className="text-xl font-bold text-danger flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              Application Error
            </h2>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              The application encountered an unexpected error while rendering this page.
            </p>
            <div className="mt-6 p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] overflow-auto max-h-[400px]">
              <code className="text-xs text-danger whitespace-pre-wrap">
                {this.state.error?.stack || this.state.error?.message}
              </code>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn primary"
                onClick={() => window.location.reload()}
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
