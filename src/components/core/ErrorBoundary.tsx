import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: 420, lineHeight: 1.6 }}>
          Sorry about that. Your data is safe — please reload to keep going.
        </p>
        <button
          onClick={this.handleReload}
          style={{
            minHeight: 48,
            padding: "0 1.5rem",
            borderRadius: 8,
            border: "none",
            background: "#0f5238",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload SimpleBill
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
