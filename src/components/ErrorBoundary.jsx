import { Component } from "react";

// TEMP debug aid: catches React render errors and shows them on screen instead
// of a blank page. Safe to remove once the app is stable.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <pre
          style={{
            color: "#fca5a5",
            background: "#150000",
            padding: 20,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            font: "12px/1.6 monospace",
            minHeight: "100vh",
          }}
        >
          ⚠ {String(this.state.error.message || this.state.error)}
          {"\n\n"}
          {this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}
