import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

// App-level error boundary. Prevents a single render error (e.g. a malformed
// API payload hitting a component) from white-screening the entire SPA — which
// is exactly what happened when PostCard read an undefined field. Shows a
// recoverable fallback instead of a blank #root.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          An unexpected error occurred while rendering this page. Try reloading, or go back home.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-primary-glow text-primary-foreground text-sm font-medium">
            Reload
          </button>
          <a href="/" onClick={this.handleReset} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">
            Go home
          </a>
        </div>
      </div>
    );
  }
}
