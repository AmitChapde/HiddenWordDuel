import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI CRASH CAUGHT BY ERROR BOUNDARY ", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary-container">
          <h2>Something went wrong </h2>
          <p>The game UI crashed. Please refresh.</p>
          <button onClick={() => window.location.reload()}>
            Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

