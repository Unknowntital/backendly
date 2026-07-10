import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="h-16 w-16 mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center text-2xl">
                            ⚠️
                        </div>
                        <h1 className="text-2xl font-display font-bold tracking-tight">
                            Something went wrong
                        </h1>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <pre className="text-xs text-red-400/70 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 text-left overflow-x-auto max-h-32">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-300 text-sm font-medium hover:bg-teal-400/20 hover:border-teal-400/50 transition-all"
                            data-testid="error-boundary-reload"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
