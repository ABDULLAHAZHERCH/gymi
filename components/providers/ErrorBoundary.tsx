'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[color:var(--background)] px-4">
          <div className="max-w-md w-full">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-[color:var(--foreground)] mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-[color:var(--muted-foreground)]">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left">
                  <summary className="text-xs font-medium text-[color:var(--muted-foreground)] cursor-pointer hover:text-[color:var(--foreground)]">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-6 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-[color:var(--foreground)] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Try again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-6 py-3 rounded-lg bg-[color:var(--foreground)] text-[color:var(--background)] text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
