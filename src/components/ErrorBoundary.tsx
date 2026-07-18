import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  title?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="form-error" role="alert">
          {this.props.title ?? 'Something went wrong showing this coaching response. Try again.'}
        </p>
      );
    }
    return this.props.children;
  }
}
