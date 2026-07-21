import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  fallbackButton?: string
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-800">
            {this.props.fallbackTitle || 'Что-то пошло не так'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {this.state.error?.message || this.props.fallbackMessage || 'Произошла непредвиденная ошибка'}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-6 rounded-lg bg-rose-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          >
            {this.props.fallbackButton || 'Попробовать снова'}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
